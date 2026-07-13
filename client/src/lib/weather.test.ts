import { describe, it, expect } from "vitest";
import { summarizeForecast } from "./weather";
import type { OwmForecastResponse } from "../types";

function entry(dateIso: string, temp: number, weatherId: number, clouds = 0) {
  return {
    dt: Math.floor(new Date(dateIso).getTime() / 1000),
    main: { temp },
    weather: [{ id: weatherId, main: "x" }],
    clouds: { all: clouds },
  };
}

describe("summarizeForecast", () => {
  it("averages today's temps and rounds", () => {
    const now = new Date("2026-07-13T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [
        entry("2026-07-13T09:00:00", 70, 800),
        entry("2026-07-13T12:00:00", 80, 800),
      ],
    };
    expect(summarizeForecast(res, now).today.temp).toBe(75);
  });

  it("prefers snow id over rain for the precip class", () => {
    const now = new Date("2026-07-13T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [
        entry("2026-07-13T09:00:00", 30, 500),
        entry("2026-07-13T12:00:00", 30, 601),
      ],
    };
    expect(summarizeForecast(res, now).today.precipClass).toBe("precip-601");
  });
});
