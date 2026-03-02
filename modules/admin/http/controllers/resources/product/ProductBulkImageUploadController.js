const { addBulkImageUploadJob, bulkImageUploadQueue } = require("../../../../../../queues/bulkImageUploadQueue");
const Logger = require("../../../../../../config/logger");

// ─── POST /upload ─────────────────────────────────────────────────────────────

const upload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No files uploaded. Please attach image or video files.",
      });
    }

    // Map multer file objects to the minimal data the worker needs
    const files = req.files.map((file) => ({
      originalname: file.originalname,
      stagingPath: file.path, // absolute path written by multer diskStorage
    }));

    const job = await addBulkImageUploadJob(files);

    Logger.info(
      `[BulkImageUpload] Queued job ${job.id} for ${files.length} file(s)`
    );

    return res.status(202).json({
      status: "queued",
      message: "Files received. Processing in the background.",
      job_id: job.id,
      total_files: files.length,
    });
  } catch (err) {
    Logger.error(`[BulkImageUpload] Upload error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while queuing the upload.",
    });
  }
};

// ─── GET /status/:jobId ───────────────────────────────────────────────────────

const getStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await bulkImageUploadQueue.getJob(jobId);

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
      progress: job.progress ?? 0, // 0–100
      total_files: job.data?.files?.length ?? 0,
      created_at: new Date(job.timestamp).toISOString(),
    };

    if (state === "completed") {
      response.result = job.returnvalue; // { saved_count, skipped_count, skipped_files }
    }

    if (state === "failed") {
      response.error = job.failedReason;
      response.attempts_made = job.attemptsMade;
    }

    return res.status(200).json(response);
  } catch (err) {
    Logger.error(`[BulkImageUpload] GetStatus error: ${err.message}`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching job status.",
    });
  }
};

module.exports = { upload, getStatus };
