const { Worker } = require("bullmq");
const { workerConnection } = require("../../config/bullConnection");
const EmailService = require("../../services/EmailService");
const Logger = require("../../config/logger");

let worker = null;

const processJob = async (job) => {
  const { name, data } = job;

  if (name === "order_confirmation") {
    const { email, name: customerName, orderCode } = data;

    if (!email) {
      throw new Error(`Order confirmation job ${job.id} missing recipient email`);
    }

    await EmailService.sendOrderConfirmationEmail(email, data);
    Logger.info(`Order confirmation email sent for order ${orderCode} → ${email}`);
    return { sent: true };
  }

  if (name === "registration_welcome") {
    const { email, name: customerName } = data;
    if (!email) {
      throw new Error(`Registration welcome job ${job.id} missing email`);
    }
    await EmailService.sendOnboardMail(email, customerName);
    Logger.info(`Registration welcome email sent → ${email}`);
    return { sent: true };
  }

  Logger.warn(`Email worker: unknown job name "${name}" (job ${job.id})`);
};

const startEmailWorker = () => {
  worker = new Worker("email", processJob, {
    connection: workerConnection,
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    Logger.info(`Email job ${job.id} (${job.name}) completed`);
  });

  worker.on("failed", (job, err) => {
    Logger.error(`Email job ${job?.id} (${job?.name}) failed [attempt ${job?.attemptsMade}]: ${err.message}`);
  });

  worker.on("error", (err) => {
    Logger.error(`Email worker error: ${err.message}`);
  });

  Logger.info("Email worker started");
  return worker;
};

const stopEmailWorker = async () => {
  if (worker) {
    await worker.close();
    Logger.info("Email worker stopped");
  }
};

module.exports = { startEmailWorker, stopEmailWorker };
