const express = require("express");
const dotenv = require("dotenv");
const { sequelize, models } = require("./database/models");
const backendApi = require("./modules/admin/routes/index");
const frontendApi = require("./modules/frontend/routes/index");
const errorMiddleware = require("./modules/admin/http/middleware/errorMiddleware");
const Logger = require("./config/logger");
const path = require("path");
const cors = require("cors");
const expressListEndpoints = require("express-list-endpoints");
const cookieParser = require("cookie-parser");
const { createAdminUser } = require("./database/seeders/adminUser");
const { seedMetaTags } = require("./database/seeders/metaTags");
const { redisClient, connectRedis } = require("./config/redis");
const { startEmailWorker, stopEmailWorker } = require("./queues/workers/emailWorker");
const { startBulkUploadWorker, stopBulkUploadWorker } = require("./queues/workers/bulkUploadWorker");
const { startBulkImageUploadWorker, stopBulkImageUploadWorker } = require("./queues/workers/bulkImageUploadWorker");
const { startStaleOrderCleanup } = require("./crons/staleOrderCleanup");
const { homeCmsData } = require("./database/seeders/HomeCms");
const users = require("./database/models/users/users");
const seedCountriesAndStates = require("./database/seeders/stateCountry");
const { seedPermissions } = require("./database/seeders/rbac/permissions");
const { seedRoles } = require("./database/seeders/rbac/roles");

dotenv.config();
const app = express();
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8081",
  "https://bosq-admin-staging.netlify.app",
  "https://bosq-staging.netlify.app",
  "https://dev-bosq.netlify.app",
  "https://admin-bosq.netlify.app",
  "https://bosq.ae",
  "https://admin.bosq.ae",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/backend", backendApi);
app.use("/api/frontend", frontendApi);

// Error handler last
app.use(errorMiddleware);

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    await seedPermissions();
    await seedRoles();

    // Sync ActivityLog table (creates it if it doesn't exist; safe for all other tables)
    await models.ActivityLog.sync({ alter: false });
    const { registerActivityHooks } = require("./modules/activityLog/activityLogService");
    registerActivityHooks(models);

    await connectRedis();
    app.set("redisClient", redisClient);

    startEmailWorker();
    startBulkUploadWorker();
    startBulkImageUploadWorker();
    startStaleOrderCleanup();

    app.listen(PORT, () => {
      Logger.info(`🚀 Server running on port ${PORT}`);

      let endpoints = expressListEndpoints(app);
      if (!endpoints.length) {
        Logger.warn("⚠️ No endpoints found at app level. Checking sub-routers...");

        const backendEndpoints = expressListEndpoints(backendApi);
        const frontendEndpoints = expressListEndpoints(frontendApi);

        if (backendEndpoints.length) {
          Logger.info("📋 Backend Endpoints:");
          backendEndpoints.forEach((e) => {
            Logger.info(`${e.methods.join(", ").padEnd(10)} /api/backend${e.path}`);
          });
        }

        if (frontendEndpoints.length) {
          Logger.info("📋 Frontend Endpoints:");
          frontendEndpoints.forEach((e) => {
            Logger.info(`${e.methods.join(", ").padEnd(10)} /api/frontend${e.path}`);
          });
        }
      } else {
        Logger.info("📋 Registered Endpoints:");
        endpoints.forEach((e) => {
          Logger.info(`${e.methods.join(", ").padEnd(10)} ${e.path}`);
        });
      }
    });
  } catch (error) {
    Logger.error("❌ Failed to start server: " + error.message);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  await stopEmailWorker();
  await stopBulkUploadWorker();
  await stopBulkImageUploadWorker();
  await sequelize.close();
  process.exit(0);
});
