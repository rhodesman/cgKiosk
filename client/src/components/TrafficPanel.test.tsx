import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TrafficPanel } from "./TrafficPanel";

afterEach(() => vi.restoreAllMocks());

const incident = {
  id: "7", type: 1, severity: 2, fullDesc: "desc",
  parameterizedDescription: { roadName: "I-95", crossRoad1: "Exit 1" },
};

describe("TrafficPanel", () => {
  it("renders incident names and emits on click", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ incidents: [incident] }) }));
    const onSelect = vi.fn();
    render(<TrafficPanel onSelectIncident={onSelect} />);
    await waitFor(() => expect(screen.getByText("I-95")).toBeInTheDocument());
    await userEvent.click(screen.getByText("I-95").closest("li")!);
    expect(onSelect).toHaveBeenCalledWith(incident);
  });

  it("shows No Traffic when empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ incidents: [] }) }));
    render(<TrafficPanel onSelectIncident={() => {}} />);
    await waitFor(() => expect(screen.getByText(/no traffic/i)).toBeInTheDocument());
  });
});
