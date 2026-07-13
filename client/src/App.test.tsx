import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { App } from "./App";

afterEach(() => vi.restoreAllMocks());

function stubAllEndpoints() {
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.includes("/api/events")) return Promise.resolve({ ok: true, json: async () => ({ CalendarEvents: [] }) });
    if (url.includes("/api/traffic")) return Promise.resolve({ ok: true, json: async () => ({ incidents: [] }) });
    if (url.includes("/api/weather")) return Promise.resolve({ ok: true, json: async () => ({ cod: "200", list: [] }) });
    return Promise.resolve({ ok: true, json: async () => [] });
  }));
}

describe("App", () => {
  it("renders all five panels", async () => {
    stubAllEndpoints();
    render(<App />);
    expect(screen.getByText(/welcome to/i)).toBeInTheDocument();
    expect(screen.getByText(/company directory/i)).toBeInTheDocument();
    expect(screen.getByText(/event schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/travel information/i)).toBeInTheDocument();
    // Flush pending async state updates from polling hooks to avoid act() warnings
    await waitFor(() => expect(screen.getByText(/travel information/i)).toBeInTheDocument());
  });

  it("highlights the map when a directory suite is clicked", async () => {
    stubAllEndpoints();
    const { container } = render(<App />);
    // Suite 700 (Ready Robotics) is a directory occupant that exists on the floor map.
    // (Suite 100 / Lighthouse is not on the legacy floor plan, so it can't be highlighted.)
    await userEvent.click(screen.getByAltText("Ready Robotics").closest("li")!);
    await waitFor(() => expect(container.querySelector(".suite.s-700")).toHaveClass("show"));
  });
});
