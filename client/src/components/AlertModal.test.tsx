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
});
