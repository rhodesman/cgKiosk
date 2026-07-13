import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { EventsPanel } from "./EventsPanel";

afterEach(() => vi.restoreAllMocks());

const event = {
  Id: 42, Name: "Demo Night", StartDate: "2026-07-13T18:00:00",
  EndDate: "2026-07-13T20:00:00", LongDescription: null, VenueAddress: null,
};

describe("EventsPanel", () => {
  it("renders event names and emits on click", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ CalendarEvents: [event] }) }));
    const onSelect = vi.fn();
    render(<EventsPanel onSelectEvent={onSelect} />);
    await waitFor(() => expect(screen.getByText("Demo Night")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Demo Night").closest("li")!);
    expect(onSelect).toHaveBeenCalledWith(event);
  });
});
