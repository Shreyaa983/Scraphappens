import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { bootstrapDatabase } from "./db/bootstrap.js";

async function listenWithPortFallback(basePort, maxRetries = 10) {
  let currentPort = basePort;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort, () => resolve(server));
        server.once("error", reject);
      });

      if (currentPort !== basePort) {
        console.warn(`Port ${basePort} is busy. Using port ${currentPort} instead.`);
      }

      console.log(`Backend running on http://localhost:${currentPort}`);
      return;
    } catch (error) {
      if (error.code === "EADDRINUSE") {
        currentPort += 1;
        continue;
      }

      throw error;
    }
  }

  throw new Error(`No free port found from ${basePort} to ${basePort + maxRetries}`);
}

async function start() {
  try {
    validateEnv();
    try {
      await bootstrapDatabase();
      console.log("Database bootstrap completed.");
    } catch (error) {
      console.warn("Database unavailable. Auth endpoints may fail until Neon is configured correctly.");
      console.warn(`DB error: ${error.message}`);
    }

    await listenWithPortFallback(env.port);
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

start();
