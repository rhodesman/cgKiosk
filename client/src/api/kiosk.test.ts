import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWeather } from "./kiosk";

afterEach(() => vi.restoreAllMocks());

describe("fetchWeather", () => {
  it("GETs /api/weather and returns json", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cod: "200", list: [] }) });
    vi.stubGlobal("fetch", spy);
    const res = await fetchWeather();
    expect(spy).toHaveBeenCalledWith("/api/weather");
    expect(res.cod).toBe("200");
  });
  it("throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    await expect(fetchWeather()).rejects.toThrow();
  });
});
