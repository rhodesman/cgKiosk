import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DirectoryPanel } from "./DirectoryPanel";

describe("DirectoryPanel", () => {
  it("renders a Space Available row for empty suites", () => {
    render(<DirectoryPanel onSelectSuite={() => {}} />);
    expect(screen.getAllByText(/space available/i).length).toBeGreaterThan(0);
  });
  it("emits the suite id on click", async () => {
    const onSelect = vi.fn();
    render(<DirectoryPanel onSelectSuite={onSelect} />);
    await userEvent.click(screen.getByText("Lighthouse").closest("li")!);
    expect(onSelect).toHaveBeenCalledWith("100");
  });
});
