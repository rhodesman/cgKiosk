import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AlertModal, type Alert } from "./AlertModal";

const trafficAlert: Alert = {
  kind: "traffic",
  data: {
    id: "1", type: 1, severity: 2, fullDesc: "Lane closed",
    parameterizedDescription: { roadName: "I-95", crossRoad1: "Exit 5" },
  },
};

const eventAlert: Alert = {
  kind: "event",
  data: {
    Id: 1,
    Name: "Board Meeting",
    StartDate: "2026-07-15T14:00:00",
    EndDate: "2026-07-15T15:30:00",
    LongDescription: "Quarterly board discussion and updates",
    VenueAddress: "Suite 700",
  },
};

describe("AlertModal", () => {
  it("renders nothing when alert is null", () => {
    const { container } = render(<AlertModal alert={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("shows a traffic alert and closes on button click", async () => {
    const onClose = vi.fn();
    render(<AlertModal alert={trafficAlert} onClose={onClose} />);
    expect(screen.getByText("I-95")).toBeInTheDocument();
    expect(screen.getByText("Lane closed")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
  it("shows an event alert with name and description", async () => {
    const onClose = vi.fn();
    render(<AlertModal alert={eventAlert} onClose={onClose} />);
    expect(screen.getByText("Board Meeting")).toBeInTheDocument();
    expect(screen.getByText("Quarterly board discussion and updates")).toBeInTheDocument();
  });
});
