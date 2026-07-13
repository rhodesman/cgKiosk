import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { WeatherPanel } from "./WeatherPanel";

afterEach(() => vi.restoreAllMocks());

describe("WeatherPanel", () => {
  it("renders averaged today temp", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        cod: "200",
        list: [{ dt: Math.floor(Date.now() / 1000), main: { temp: 71 }, weather: [{ id: 800, main: "Clear" }], clouds: { all: 0 } }],
      }),
    }));
    render(<WeatherPanel />);
    await waitFor(() => expect(screen.getByText(/71/)).toBeInTheDocument());
  });
});
