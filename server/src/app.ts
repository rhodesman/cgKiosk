import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as defaultConfig, type Config } from "./config.js";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp(config: Config = defaultConfig): Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  registerRoutes(app, config);

  // Unmatched /api routes are JSON 404s.
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Everything else: serve the built SPA if present.
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) res.status(404).send("Client build not found. Run `npm run build`.");
    });
  });

  return app;
}
