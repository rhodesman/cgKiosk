import express, { type Express } from "express";
import { config as defaultConfig, type Config } from "./config.js";
import { registerRoutes } from "./routes.js";

export function createApp(config: Config = defaultConfig): Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  registerRoutes(app, config);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  return app;
}
