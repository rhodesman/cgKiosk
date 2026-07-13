import { useEffect, useRef, useState } from "react";

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const result = await fetcherRef.current();
        if (active) { setData(result); setError(null); }
      } catch (err) {
        if (active) setError(err);
      }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return { data, error };
}
