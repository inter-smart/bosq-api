const { randomUUID } = require("crypto");
const { redisClient } = require("../../../../../../config/redis");
const { parseProductMetaExcelBuffer } = require("../../../../../../services/bulkUpload/excelParserService");
const { validateProductMetaUpload } = require("../../../../../../services/bulkUpload/productMetaBulkValidatorService");
const { getMetaExportData } = require("../../../../../../services/bulkUpload/exportMetaDataService");
const { addMetaUploadJob, bulkUploadQueue } = require("../../../../../../queues/bulkUploadQueue");
const Logger = require("../../../../../../config/logger");

const META_SESSION_PREFIX = "bulk_meta_session:";
const SESSION_TTL_SECONDS = 3600; // 1 hour

// ─── POST /bulk/export ─────────────────────────────────────────────────────────

const exportSelected = async (req, res) => {
  try {
    const { variant_ids } = req.body;

    if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "variant_ids must be a non-empty array of integers.",
      });
    }

    if (variant_ids.length > 500) {
      return res.status(400).json({
        status: "error",
        message: "Maximum 500 variants can be exported at once.",
      });
    }

    const ids = variant_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length !== variant_ids.length) {
      return res.status(400).json({
        status: "error",
        message: "All variant_ids must be positive integers.",
      });
    }

    const rows = await getMetaExportData(ids);

    Logger.info(`[MetaBulkUpload] Export meta data — ${ids.length} IDs requested, ${rows.length} rows returned`);

    return res.status(200).json({ status: "success", data: { rows } });
  } catch (err) {
    Logger.error(`[MetaBulkUpload] Export error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while exporting meta data.",
    });
  }
};

// ─── POST /bulk/validate ────────────────────────────────────────────────────────

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

    let parsedSheets;
    try {
      parsedSheets = await parseProductMetaExcelBuffer(req.file.buffer);
    } catch (parseErr) {
      return res.status(422).json({
        status: "failed",
        message: `Excel parsing error: ${parseErr.message}`,
        errors: [],
      });
    }

    const metaRows = parsedSheets.product_meta;
    if (!Array.isArray(metaRows) || metaRows.length === 0) {
      return res.status(422).json({
        status: "failed",
        message: "The product_meta sheet is empty — add at least one row.",
        errors: [],
      });
    }

    const result = await validateProductMetaUpload(metaRows);

    if (!result.valid) {
      return res.status(422).json({
        status: "failed",
        summary: result.summary,
        errors: result.errors,
      });
    }

    const token = randomUUID();
    const redisKey = `${META_SESSION_PREFIX}${token}`;
    await redisClient.setEx(redisKey, SESSION_TTL_SECONDS, JSON.stringify({ metaRows: result.metaRows }));

    Logger.info(`[MetaBulkUpload] Validation passed. Token stored: ${token}`);

    return res.status(200).json({
      status: "success",
      message: "Validation passed. Ready for upload.",
      token,
      summary: result.summary,
    });
  } catch (err) {
    Logger.error(`[MetaBulkUpload] Validate error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during validation.",
    });
  }
};

// ─── POST /bulk/approve ─────────────────────────────────────────────────────────

const approve = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Missing required field: token",
      });
    }

    const redisKey = `${META_SESSION_PREFIX}${token}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      return res.status(400).json({
        status: "error",
        message: "Validation token is invalid or has expired. Please re-validate your file.",
      });
    }

    const job = await addMetaUploadJob(token);

    Logger.info(`[MetaBulkUpload] Approval queued. Job ID: ${job.id}, Token: ${token}`);

    return res.status(202).json({
      status: "queued",
      message: "Meta upload job has been queued successfully.",
      job_id: job.id,
    });
  } catch (err) {
    Logger.error(`[MetaBulkUpload] Approve error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during approval.",
    });
  }
};

// ─── GET /bulk/status/:jobId ────────────────────────────────────────────────────
// Reuses the same queue — job IDs are unique across all job types

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
    Logger.error(`[MetaBulkUpload] GetStatus error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching job status.",
    });
  }
};

module.exports = { exportSelected, validate, approve, getStatus };
