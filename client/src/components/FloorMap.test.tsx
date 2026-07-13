import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FloorMap } from "./FloorMap";

describe("FloorMap", () => {
  it("adds show to a highlighted suite", () => {
    const { container } = render(<FloorMap highlighted={[".suite.s-700"]} />);
    const el = container.querySelector(".suite.s-700");
    expect(el).toHaveClass("show");
  });
  it("leaves non-highlighted suites without show", () => {
    const { container } = render(<FloorMap highlighted={[]} />);
    expect(container.querySelector(".suite.s-700")).not.toHaveClass("show");
  });
});
