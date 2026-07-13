import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePolling } from "./usePolling";

afterEach(() => vi.restoreAllMocks());

describe("usePolling", () => {
  it("fetches immediately and exposes data", async () => {
    const fetcher = vi.fn().mockResolvedValue("hello");
    const { result } = renderHook(() => usePolling(fetcher, 60000));
    await waitFor(() => expect(result.current.data).toBe("hello"));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retains previous data on error", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockRejectedValueOnce(new Error("down"));
    vi.useFakeTimers();
    const { result } = renderHook(() => usePolling(fetcher, 1000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data).toBe("first");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data).toBe("first");
    expect(result.current.error).toBeInstanceOf(Error);
    vi.useRealTimers();
  });
});
