const { randomUUID } = require("crypto");
const { redisClient } = require("../../../../../../config/redis");
const { parseExcelBuffer } = require("../../../../../../services/bulkUpload/excelParserService");
const { validateBulkUpload } = require("../../../../../../services/bulkUpload/bulkValidatorService");
const { addBulkUploadJob, bulkUploadQueue } = require("../../../../../../queues/bulkUploadQueue");
const Logger = require("../../../../../../config/logger");

const SESSION_PREFIX = "bulk_upload_session:";
const SESSION_TTL_SECONDS = 3600; // 1 hour

// ─── POST /validate ──────────────────────────────────────────────────────────

const validate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded. Please attach an Excel file (.xlsx) with field name 'file'.",
      });
    }

    const ext = req.file.originalname?.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid file type. Only .xlsx and .xls files are accepted.",
      });
    }

    // Parse Excel from memory buffer
    let parsedSheets;
    try {
      parsedSheets = await parseExcelBuffer(req.file.buffer);
    } catch (parseErr) {
      return res.status(422).json({
        status: "failed",
        message: `Excel parsing error: ${parseErr.message}`,
        errors: [],
      });
    }

    // Validate
    const result = await validateBulkUpload(parsedSheets);

    if (!result.valid) {
      return res.status(422).json({
        status: "failed",
        summary: result.summary,
        errors: result.errors,
      });
    }

    // Store validated hierarchy in Redis
    const token = randomUUID();
    const redisKey = `${SESSION_PREFIX}${token}`;
    await redisClient.setEx(redisKey, SESSION_TTL_SECONDS, JSON.stringify(result.hierarchy));

    Logger.info(`[BulkUpload] Validation passed. Token stored: ${token}`);

    return res.status(200).json({
      status: "success",
      message: "Validation passed. Ready for upload.",
      token,
      summary: result.summary,
    });
  } catch (err) {
    Logger.error(`[BulkUpload] Validate error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during validation.",
    });
  }
};

// ─── POST /approve ───────────────────────────────────────────────────────────

const approve = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Missing required field: token",
      });
    }

    const redisKey = `${SESSION_PREFIX}${token}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      return res.status(400).json({
        status: "error",
        message: "Validation token is invalid or has expired. Please re-validate your file.",
      });
    }

    const job = await addBulkUploadJob(token);

    Logger.info(`[BulkUpload] Approval queued. Job ID: ${job.id}, Token: ${token}`);

    return res.status(202).json({
      status: "queued",
      message: "Bulk upload job has been queued successfully.",
      job_id: job.id,
    });
  } catch (err) {
    Logger.error(`[BulkUpload] Approve error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during approval.",
    });
  }
};

// ─── GET /status/:jobId ──────────────────────────────────────────────────────

const getStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await bulkUploadQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        status: "error",
        message: `Job with ID "${jobId}" not found.`,
      });
    }

    const state = await job.getState();
    const response = {
      job_id: job.id,
      state,
      progress: job.progress,
      created_at: new Date(job.timestamp).toISOString(),
    };

    if (state === "completed") {
      response.result = job.returnvalue;
    }

    if (state === "failed") {
      response.error = job.failedReason;
      response.attempts_made = job.attemptsMade;
    }

    return res.status(200).json(response);
  } catch (err) {
    Logger.error(`[BulkUpload] GetStatus error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching job status.",
    });
  }
};

module.exports = { validate, approve, getStatus };
