import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const cfg = {
  port: 8089,
  nexudusBase: "https://nex.test/en",
  weather: { apiKey: "wkey", cityId: "111" },
  traffic: { apiKey: "mkey", boundingBox: "1,2,3,4", filters: "congestion" },
};

afterEach(() => vi.restoreAllMocks());

function stubFetch() {
  const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("routes", () => {
  it("proxies events to Nexudus", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/events");
    expect(spy).toHaveBeenCalledWith("https://nex.test/en/events");
  });

  it("proxies space bookings with the date param", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/space/2026-07-13");
    expect(spy).toHaveBeenCalledWith(
      "https://nex.test/en/bookings/fullCalendarEvents?start=2026-07-13&end=2026-07-13",
    );
  });

  it("proxies weather with key and city id", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/weather");
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("id=111");
    expect(url).toContain("APPID=wkey");
    expect(url).toContain("units=imperial");
  });

  it("proxies traffic with key, boundingBox and filters", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/traffic");
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("key=mkey");
    expect(url).toContain("boundingBox=1,2,3,4");
    expect(url).toContain("filters=congestion");
  });
});
