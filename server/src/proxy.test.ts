import { describe, it, expect, vi, afterEach } from "vitest";
import { proxyJson } from "./proxy.js";

function mockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("proxyJson", () => {
  it("relays upstream JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ hello: "world" }),
    }));
    const res = mockRes();
    await proxyJson(res as never, "https://x.test");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ hello: "world" });
  });

  it("returns 502 when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    const res = mockRes();
    await proxyJson(res as never, "https://x.test");
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });

  it("returns 502 on non-ok upstream status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = mockRes();
    await proxyJson(res as never, "https://x.test");
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });
});
