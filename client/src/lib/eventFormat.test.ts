import { describe, it, expect } from "vitest";
import { formatEventListDate, formatEventFullDate } from "./eventFormat";

describe("formatEventListDate", () => {
  it("formats afternoon events as PM with abbrev month", () => {
    const { label, time } = formatEventListDate("2026-07-13T14:30:00");
    expect(label).toBe("Jul 13");
    expect(time).toBe("2:30 PM");
  });
  it("pads a zero minute", () => {
    const { time } = formatEventListDate("2026-07-13T09:00:00");
    expect(time).toBe("9:00 AM");
  });
});

describe("formatEventFullDate", () => {
  it("formats full m/d/yyyy with time", () => {
    expect(formatEventFullDate("2026-07-13T14:00:00")).toBe("7/13/2026 2:00 PM");
  });
});
