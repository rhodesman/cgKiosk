import { describe, it, expect } from "vitest";
import { suiteSelector } from "./suites";

describe("suiteSelector", () => {
  it("maps 101–199 to office selectors", () => {
    expect(suiteSelector(105)).toBe(".suite.o-105");
    expect(suiteSelector("101")).toBe(".suite.o-101");
  });
  it("maps everything else to suite selectors", () => {
    expect(suiteSelector(700)).toBe(".suite.s-700");
    expect(suiteSelector("100")).toBe(".suite.s-100");
    expect(suiteSelector(200)).toBe(".suite.s-200");
  });
});
