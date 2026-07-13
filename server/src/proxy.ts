import type { Response } from "express";

export async function proxyJson(res: Response, url: string): Promise<void> {
  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream responded ${upstream.status}` });
      return;
    }
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: `Upstream request failed: ${(err as Error).message}` });
  }
}
