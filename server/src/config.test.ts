import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("reads values from the provided env", () => {
    const cfg = loadConfig({
      PORT: "9000",
      NEXUDUS_BASE: "https://example.test/en",
      OPENWEATHER_API_KEY: "wkey",
      OPENWEATHER_CITY_ID: "123",
      MAPQUEST_API_KEY: "mkey",
      MAPQUEST_BOUNDING_BOX: "1,2,3,4",
      MAPQUEST_FILTERS: "congestion",
    });
    expect(cfg.port).toBe(9000);
    expect(cfg.weather.apiKey).toBe("wkey");
    expect(cfg.traffic.boundingBox).toBe("1,2,3,4");
  });

  it("defaults the port to 8089", () => {
    const cfg = loadConfig({});
    expect(cfg.port).toBe(8089);
  });
});
