import { describe, it, expect } from "vitest";
import { businesses } from "./businesses";

describe("businesses", () => {
  it("has the full directory", () => {
    expect(businesses).toHaveLength(17);
    expect(businesses[0]).toMatchObject({ suite: "100", company: "Lighthouse" });
  });
});
