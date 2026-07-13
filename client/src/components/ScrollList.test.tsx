import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScrollList } from "./ScrollList";

describe("ScrollList", () => {
  it("renders children inside .list > ul", () => {
    render(
      <ScrollList>
        <li>row</li>
      </ScrollList>,
    );
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list.parentElement).toHaveClass("list");
    expect(screen.getByText("row")).toBeInTheDocument();
  });
});
