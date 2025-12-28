// server/src/app.js
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { isProd } from "./config/env.js";
import { buildCors } from "./middleware/cors.js";
import { requestOriginLog } from "./middleware/requestOriginLog.js";
import { apiCacheControl } from "./middleware/apiCacheControl.js";
import { errorHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./routes/health.routes.js";
import plansRoutes from "./routes/plans.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import universeRoutes from "./routes/universe.routes.js";
import webhooksRoutes from "./routes/webhooks.routes.js";
import { buildPushRoutes } from "./routes/push.routes.js";

export function createApp({ admin, adminInitialized }) {
  const app = express();

  app.use(cookieParser());
  app.use(requestOriginLog);

  app.use(buildCors());
  app.options("*", buildCors());

  app.use(
    helmet({
      crossOriginOpenerPolicy: isProd ? { policy: "same-origin" } : false,
      crossOriginEmbedderPolicy: isProd ? true : false,
      originAgentCluster: isProd ? true : false,
    })
  );

  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (res.getHeader("Content-Encoding")) return false;
        return compression.filter(req, res);
      },
    })
  );

  app.use(morgan("dev"));
  app.use(apiCacheControl);

  // --- Webhooks BEFORE JSON parsing (raw body) ---
  app.use("/api/webhooks", webhooksRoutes);

  // Now it’s safe to parse JSON for all other routes
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Routes
  app.use("/", healthRoutes);
  app.use("/api", healthRoutes);

  app.use("/api/plans", plansRoutes);
  app.use("/api/events", eventsRoutes);
  app.use("/api/universe", universeRoutes);
  app.use("/api/push", buildPushRoutes({ admin, adminInitialized }));

  app.use(errorHandler);
  return app;
}
