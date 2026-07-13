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

  it("rounds non-integer averages for today bucket", () => {
    // 70 + 71 = 141; 141 / 2 = 70.5; Math.round(70.5) === 71
    const now = new Date("2026-07-15T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [
        entry("2026-07-15T09:00:00", 70, 800),
        entry("2026-07-15T12:00:00", 71, 800),
      ],
    };
    expect(summarizeForecast(res, now).today.temp).toBe(71);
  });

  it("buckets an entry dated day+1 into tomorrow", () => {
    // now = July 15 (date=15), entry = July 16 (date=16)
    const now = new Date("2026-07-15T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [entry("2026-07-16T09:00:00", 85, 800)],
    };
    expect(summarizeForecast(res, now).tomorrow.temp).toBe(85);
  });

  it("buckets a Saturday entry (different date-of-month from now) into weekend", () => {
    // 2026-07-18T09:00:00 is a Saturday: new Date('2026-07-18T09:00:00').getDay() === 6
    // now = July 15 (date=15); weekend entry date=18, differs from now's date
    const now = new Date("2026-07-15T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [entry("2026-07-18T09:00:00", 90, 800)],
    };
    expect(summarizeForecast(res, now).weekend.temp).toBe(90);
  });

  it("returns empty-bucket defaults for tomorrow and weekend when only today is populated", () => {
    const now = new Date("2026-07-15T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [entry("2026-07-15T09:00:00", 75, 800)],
    };
    const result = summarizeForecast(res, now);
    expect(result.tomorrow.temp).toBe(0);
    expect(result.tomorrow.precipClass).toBe("");
    expect(result.weekend.temp).toBe(0);
    expect(result.weekend.precipClass).toBe("");
  });

  it("prefers rain id over a trailing non-precip id in today bucket", () => {
    // rain id 500 followed by clear id 800: snow=undefined, rain=500, last=800
    // precip = snow ?? rain ?? last = 500
    const now = new Date("2026-07-15T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [
        entry("2026-07-15T09:00:00", 70, 500),
        entry("2026-07-15T12:00:00", 70, 800),
      ],
    };
    expect(summarizeForecast(res, now).today.precipClass).toBe("precip-500");
  });
});
