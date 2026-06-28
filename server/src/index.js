import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  validateEnv();
  await connectDB();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to start API", error);
  process.exit(1);
});
