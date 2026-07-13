import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("static serving", () => {
  it("keeps /api 404s as JSON", async () => {
    const res = await request(createApp()).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
  });
});
