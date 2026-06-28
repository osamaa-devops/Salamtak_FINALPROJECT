import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { applySecurity } from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { apiRoutes } from "./routes/apiRoutes.js";

export function createApp() {
  const app = express();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const buildPath = path.resolve(__dirname, "../../build");

  applySecurity(app);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", apiRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(buildPath));
    app.use((req, res, next) => {
      if (req.method === "GET" && req.accepts("html")) {
        res.sendFile(path.join(buildPath, "index.html"));
        return;
      }

      next();
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
