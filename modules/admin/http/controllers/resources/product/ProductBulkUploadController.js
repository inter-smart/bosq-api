const { randomUUID } = require("crypto");
const { redisClient } = require("../../../../../../config/redis");
const { parseExcelBuffer, parseFaqExcelBuffer } = require("../../../../../../services/bulkUpload/excelParserService");
const { validateBulkUpload } = require("../../../../../../services/bulkUpload/bulkValidatorService");
const { validateFaqUpload } = require("../../../../../../services/bulkUpload/faqBulkValidatorService");
const { addBulkUploadJob, addFaqUploadJob, bulkUploadQueue } = require("../../../../../../queues/bulkUploadQueue");
const { getExportData } = require("../../../../../../services/bulkUpload/exportVariantDataService");
const Logger = require("../../../../../../config/logger");

const SESSION_PREFIX = "bulk_upload_session:";
const FAQ_SESSION_PREFIX = "bulk_faq_session:";
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

// ─── POST /faqs/validate ─────────────────────────────────────────────────────

const validateFaqs = async (req, res) => {
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

    // Parse Excel — expects a product_faqs sheet only
    let parsedSheets;
    try {
      parsedSheets = await parseFaqExcelBuffer(req.file.buffer);
    } catch (parseErr) {
      return res.status(422).json({
        status: "failed",
        message: `Excel parsing error: ${parseErr.message}`,
        errors: [],
      });
    }

    const faqRows = parsedSheets.product_faqs;
    if (!Array.isArray(faqRows) || faqRows.length === 0) {
      return res.status(422).json({
        status: "failed",
        message: "The product_faqs sheet is empty — add at least one FAQ row.",
        errors: [],
      });
    }

    const result = await validateFaqUpload(faqRows);

    if (!result.valid) {
      return res.status(422).json({
        status: "failed",
        summary: result.summary,
        errors: result.errors,
      });
    }

    // Store validated FAQ hierarchy in Redis
    const token = randomUUID();
    const redisKey = `${FAQ_SESSION_PREFIX}${token}`;
    await redisClient.setEx(redisKey, SESSION_TTL_SECONDS, JSON.stringify(result.hierarchy));

    Logger.info(`[FaqUpload] Validation passed. Token stored: ${token}`);

    return res.status(200).json({
      status: "success",
      message: "FAQ validation passed. Ready for upload.",
      token,
      summary: result.summary,
    });
  } catch (err) {
    Logger.error(`[FaqUpload] Validate error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during FAQ validation.",
    });
  }
};

// ─── POST /faqs/approve ──────────────────────────────────────────────────────

const approveFaqs = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Missing required field: token",
      });
    }

    const redisKey = `${FAQ_SESSION_PREFIX}${token}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      return res.status(400).json({
        status: "error",
        message: "FAQ validation token is invalid or has expired. Please re-validate your file.",
      });
    }

    const job = await addFaqUploadJob(token);

    Logger.info(`[FaqUpload] Approval queued. Job ID: ${job.id}, Token: ${token}`);

    return res.status(202).json({
      status: "queued",
      message: "FAQ upload job has been queued successfully.",
      job_id: job.id,
    });
  } catch (err) {
    Logger.error(`[FaqUpload] Approve error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during FAQ approval.",
    });
  }
};

// ─── GET /faqs/status/:jobId ─────────────────────────────────────────────────
// Reuses the same queue — job IDs are unique across all job types

const getFaqStatus = async (req, res) => {
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
    Logger.error(`[FaqUpload] GetStatus error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching FAQ job status.",
    });
  }
};

// ─── POST /export-variant-data ────────────────────────────────────────────────

const exportVariantData = async (req, res) => {
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

    const data = await getExportData(ids);

    Logger.info(`[BulkUpload] Export variant data — ${ids.length} IDs requested, ${data.variants.length} rows returned`);

    return res.status(200).json({ status: "success", data });
  } catch (err) {
    Logger.error(`[BulkUpload] ExportVariantData error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while exporting variant data.",
    });
  }
};

module.exports = { validate, approve, getStatus, validateFaqs, approveFaqs, getFaqStatus, exportVariantData };
