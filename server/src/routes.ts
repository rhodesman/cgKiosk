import type { Express } from "express";
import type { Config } from "./config.js";
import { proxyJson } from "./proxy.js";

export function registerRoutes(app: Express, config: Config): void {
  app.get("/api/events", (_req, res) =>
    proxyJson(res, `${config.nexudusBase}/events`),
  );

  app.get("/api/space/:date", (req, res) => {
    const date = encodeURIComponent(req.params.date);
    proxyJson(
      res,
      `${config.nexudusBase}/bookings/fullCalendarEvents?start=${date}&end=${date}`,
    );
  });

  app.get("/api/weather", (_req, res) => {
    const { apiKey, cityId } = config.weather;
    proxyJson(
      res,
      `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&units=imperial&APPID=${apiKey}`,
    );
  });

  app.get("/api/traffic", (_req, res) => {
    const { apiKey, boundingBox, filters } = config.traffic;
    proxyJson(
      res,
      `https://www.mapquestapi.com/traffic/v2/incidents?key=${apiKey}&boundingBox=${boundingBox}&filters=${filters}`,
    );
  });
}
