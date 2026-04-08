const { models } = require("../../../../database/models/index.js");
const { sendSuccessResponse, sendErrorResponse } = require("../traits/responseHandler.js");
const { addClient, removeClient, formatActivity } = require("../../../activityLog/activityLogService.js");
const jwt = require("jsonwebtoken");

class ActivityLogController {
  // GET /dashboard/activity — returns 20 most recent activity entries
  static async getActivity(req, res) {
    try {
      const logs = await models.ActivityLog.findAll({
        order: [["createdAt", "DESC"]],
        limit: 20,
      });
      sendSuccessResponse(res, logs.map(formatActivity), "Activity log retrieved successfully");
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  // GET /dashboard/activity/stream — SSE endpoint
  // Auth is handled via ?token= query param since EventSource cannot send custom headers
  static async streamActivity(req, res) {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: "Token required", code: "UNAUTHORIZED" },
      });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid or expired token", code: "UNAUTHORIZED" },
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx proxy buffering
    res.flushHeaders();

    // Immediate heartbeat so the browser knows the connection is open
    res.write(": heartbeat\n\n");

    const clientId = addClient(res);

    // Keep-alive ping every 25s (browser SSE timeout is ~30s)
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeClient(clientId);
    });
  }
}

module.exports = ActivityLogController;
