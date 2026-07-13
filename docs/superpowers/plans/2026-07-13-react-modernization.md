# City Garage Kiosk — React Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the 2018/2019 jQuery + Express + CodeKit kiosk to a React + Vite + TypeScript monorepo, replacing CodeKit with Vite's built-in Sass, while preserving the look and behavior exactly.

**Architecture:** npm-workspaces monorepo with two packages — `client/` (Vite + React + TS front end) and `server/` (Express proxy in TS). The server proxies all third-party APIs (Nexudus, OpenWeatherMap, MapQuest) so no keys reach the browser; in dev Vite proxies `/api` to it, in prod Express serves the built client. Pure data-transform logic is extracted into a tested `lib/` and panels are React components with a shared `usePolling` hook.

**Tech Stack:** Node 18+, TypeScript (strict), Vite, React 18, Sass (Dart Sass via Vite), Express 4, tsx, Vitest, React Testing Library, ESLint (typescript-eslint + react-hooks), Prettier, concurrently.

## Global Constraints

- Node 18+ required (native `fetch` on the server; no `unirest`/`node-libcurl`).
- TypeScript `strict: true` in both packages.
- No jQuery, no Bootstrap JS, no CodeKit, no gulp, no `node-libcurl`, no `unirest` in final deps.
- Faithful port: preserve existing markup structure, SCSS output, and behaviors (60s data poll, 30s scroll-reset, 30s modal auto-close, 5s map-highlight).
- All third-party API keys and tuning values live in `server/.env` (git-ignored); `server/.env.example` documents every key.
- Nexudus events base: `https://betamore.spaces.nexudus.com/en`.
- OpenWeatherMap: forecast endpoint, `units=imperial`, city id `4347820`.
- MapQuest: traffic v2 incidents, boundingBox `39.082695,-76.778641,39.413972,-76.415405`, filters `congestion,incidents,event`.
- Suite→selector rule: id in `[101,199]` → `.suite.o-<id>`; otherwise `.suite.s-<id>`.
- Commit after every task (Conventional Commits style).

---

## Phase 0 — Workspace & tooling

### Task 1: Connect to existing remote and set up workspace root

**Context:** A GitHub repo already exists at `git@github.com:rhodesman/cgKiosk.git` (default branch `main`) with a single "Initial commit" containing this same legacy code plus a committed `node_modules/` and `.DS_Store` (it had no `.gitignore`). This local folder is **not yet connected** to it. We adopt that commit as our history base rather than starting fresh, then stop tracking `node_modules`.

**Files:**
- Create: `.gitignore`
- Create: `package.json` (root, replaces existing)
- Modify: existing root `package.json` is overwritten (back up as `package.legacy.json` first)

**Interfaces:**
- Produces: local repo tracking `origin/main`; npm workspaces `client` and `server`; root scripts `dev`, `build`, `start`, `test`, `lint`, `format`.

- [ ] **Step 1: Connect the folder to the existing remote, basing on its history**

```bash
cd /Users/jrhodes/Development/github/cgKiosk
git init -b main
git remote add origin git@github.com:rhodesman/cgKiosk.git
git fetch origin
git reset --mixed origin/main       # HEAD/index become the remote's Initial commit; working tree untouched
git checkout -b react-modernization # all work lands on this branch; main stays stable
cp package.json package.legacy.json
```

Run `git status` — expected: on branch `react-modernization`, working tree matches the remote (mostly "nothing to commit" for the legacy files), confirming the folder is now on top of the existing history.

- [ ] **Step 2: Write `.gitignore`**

```gitignore
node_modules/
dist/
build/
.env
.env.local
*.local
.DS_Store
.cache/
coverage/
```

- [ ] **Step 3: Stop tracking files the remote committed by mistake**

```bash
git rm -r --cached node_modules .DS_Store > /dev/null
```
Expected: thousands of `node_modules/*` paths and `.DS_Store` staged for removal from tracking (they stay on disk).

- [ ] **Step 4: Write the new root `package.json`**

```json
{
  "name": "citygaragekiosk",
  "version": "2.0.0",
  "description": "Interactive Kiosk for City Garage",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm:dev -w server\" \"npm:dev -w client\"",
    "build": "npm run build -w client && npm run build -w server",
    "start": "node server/dist/index.js",
    "test": "npm run test -w client && npm run test -w server",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,scss,json,md}\""
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "eslint": "^9.15.0",
    "typescript-eslint": "^8.15.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "prettier": "^3.4.0"
  }
}
```

- [ ] **Step 5: Verify workspace resolves (will warn about missing member package.jsons — expected until Tasks 2 & 6)**

Run: `npm pkg get workspaces`
Expected: prints `{ "workspaces": ["client","server"] }`

- [ ] **Step 6: Commit and push to the existing remote**

```bash
git add -A
git commit -m "chore: stop tracking node_modules; convert root to npm workspaces monorepo"
git push -u origin react-modernization
```

Expected: push succeeds; `origin/react-modernization` now has the workspace root on top of the Initial commit. `main` is untouched.

> Subsequent tasks commit locally; push at phase boundaries (or whenever you want a remote checkpoint) with `git push`. The final task opens a PR from `react-modernization` into `main`.

---

## Phase 1 — Server (Express proxy in TypeScript)

### Task 2: Scaffold the server package with a health route

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/app.ts`
- Create: `server/vitest.config.ts`
- Test: `server/src/app.test.ts`

**Interfaces:**
- Produces: `createApp(): express.Express` from `server/src/app.ts`; server listens in `index.ts` on `process.env.PORT || 8089`.

- [ ] **Step 1: Write `server/package.json`**

```json
{
  "name": "server",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.9.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `server/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Write the failing test `server/src/app.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("app", () => {
  it("responds to GET /api/health", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await request(createApp()).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -w server`
Expected: FAIL — cannot find `./app.js`

- [ ] **Step 6: Write `server/src/app.ts`**

```ts
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
```

- [ ] **Step 7: Write `server/src/index.ts`**

```ts
import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 8089;
createApp().listen(port, () => {
  console.log(`Kiosk server running on http://localhost:${port}`);
});
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -w server`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add server
git commit -m "feat(server): scaffold express+ts app with health route"
```

---

### Task 3: Environment config module

**Files:**
- Create: `server/src/config.ts`
- Create: `server/.env.example`
- Create: `server/.env` (git-ignored; real values)
- Test: `server/src/config.test.ts`

**Interfaces:**
- Produces: `config` object with `port`, `nexudusBase`, `weather.{apiKey,cityId}`, `traffic.{apiKey,boundingBox,filters}`.

- [ ] **Step 1: Write `server/.env.example`**

```dotenv
PORT=8089
NEXUDUS_BASE=https://betamore.spaces.nexudus.com/en
OPENWEATHER_API_KEY=your-openweathermap-key
OPENWEATHER_CITY_ID=4347820
MAPQUEST_API_KEY=your-mapquest-key
MAPQUEST_BOUNDING_BOX=39.082695,-76.778641,39.413972,-76.415405
MAPQUEST_FILTERS=congestion,incidents,event
```

- [ ] **Step 2: Write `server/.env` with the values ported from the legacy client**

`server/.env` is git-ignored — do NOT commit real keys, and do not paste them into any tracked file (a committed key trips GitHub push protection). Copy the two real key values out of the legacy client source, which still contains them hardcoded:
- `OPENWEATHER_API_KEY` — the `APPID=` value in `src/js/main.js` (`getWeather`).
- `MAPQUEST_API_KEY` — the `key=` value in `src/js/main.js` (`getTraffic`).

```dotenv
PORT=8089
NEXUDUS_BASE=https://betamore.spaces.nexudus.com/en
OPENWEATHER_API_KEY=<copy APPID from legacy src/js/main.js getWeather>
OPENWEATHER_CITY_ID=4347820
MAPQUEST_API_KEY=<copy key from legacy src/js/main.js getTraffic>
MAPQUEST_BOUNDING_BOX=39.082695,-76.778641,39.413972,-76.415405
MAPQUEST_FILTERS=congestion,incidents,event
```

> These keys have been public in the repo's initial commit (hardcoded in `src/js/main.js` / `site/dist/main-min.js`) for years — treat them as compromised and rotate them at OpenWeatherMap and MapQuest before any real deployment. The legacy hardcoded copies are deleted in Task 27.

- [ ] **Step 3: Write the failing test `server/src/config.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("reads values from the provided env", () => {
    const cfg = loadConfig({
      PORT: "9000",
      NEXUDUS_BASE: "https://example.test/en",
      OPENWEATHER_API_KEY: "wkey",
      OPENWEATHER_CITY_ID: "123",
      MAPQUEST_API_KEY: "mkey",
      MAPQUEST_BOUNDING_BOX: "1,2,3,4",
      MAPQUEST_FILTERS: "congestion",
    });
    expect(cfg.port).toBe(9000);
    expect(cfg.weather.apiKey).toBe("wkey");
    expect(cfg.traffic.boundingBox).toBe("1,2,3,4");
  });

  it("defaults the port to 8089", () => {
    const cfg = loadConfig({});
    expect(cfg.port).toBe(8089);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -w server`
Expected: FAIL — cannot find `./config.js`

- [ ] **Step 5: Write `server/src/config.ts`**

```ts
type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env) {
  return {
    port: Number(env.PORT) || 8089,
    nexudusBase: env.NEXUDUS_BASE ?? "https://betamore.spaces.nexudus.com/en",
    weather: {
      apiKey: env.OPENWEATHER_API_KEY ?? "",
      cityId: env.OPENWEATHER_CITY_ID ?? "4347820",
    },
    traffic: {
      apiKey: env.MAPQUEST_API_KEY ?? "",
      boundingBox: env.MAPQUEST_BOUNDING_BOX ?? "",
      filters: env.MAPQUEST_FILTERS ?? "congestion,incidents,event",
    },
  };
}

export type Config = ReturnType<typeof loadConfig>;
export const config = loadConfig();
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -w server`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/config.ts server/src/config.test.ts server/.env.example
git commit -m "feat(server): env-driven config module"
```

---

### Task 4: Upstream proxy helper

**Files:**
- Create: `server/src/proxy.ts`
- Test: `server/src/proxy.test.ts`

**Interfaces:**
- Produces: `proxyJson(res, url): Promise<void>` — fetches `url`, relays JSON on success, sends `{ error }` with status 502 on upstream failure. Uses global `fetch`.

- [ ] **Step 1: Write the failing test `server/src/proxy.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { proxyJson } from "./proxy.js";

function mockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("proxyJson", () => {
  it("relays upstream JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ hello: "world" }),
    }));
    const res = mockRes();
    await proxyJson(res as never, "https://x.test");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ hello: "world" });
  });

  it("returns 502 when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    const res = mockRes();
    await proxyJson(res as never, "https://x.test");
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });

  it("returns 502 on non-ok upstream status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = mockRes();
    await proxyJson(res as never, "https://x.test");
    expect(res.statusCode).toBe(502);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w server`
Expected: FAIL — cannot find `./proxy.js`

- [ ] **Step 3: Write `server/src/proxy.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w server`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/proxy.ts server/src/proxy.test.ts
git commit -m "feat(server): resilient JSON proxy helper"
```

---

### Task 5: API routes (events, space, weather, traffic)

**Files:**
- Create: `server/src/routes.ts`
- Modify: `server/src/app.ts` (register routes)
- Test: `server/src/routes.test.ts`

**Interfaces:**
- Consumes: `config` (Task 3), `proxyJson` (Task 4).
- Produces: `registerRoutes(app, config)` mounting `/api/events`, `/api/space/:date`, `/api/weather`, `/api/traffic`.

- [ ] **Step 1: Write the failing test `server/src/routes.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const cfg = {
  port: 8089,
  nexudusBase: "https://nex.test/en",
  weather: { apiKey: "wkey", cityId: "111" },
  traffic: { apiKey: "mkey", boundingBox: "1,2,3,4", filters: "congestion" },
};

afterEach(() => vi.restoreAllMocks());

function stubFetch() {
  const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("routes", () => {
  it("proxies events to Nexudus", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/events");
    expect(spy).toHaveBeenCalledWith("https://nex.test/en/events");
  });

  it("proxies space bookings with the date param", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/space/2026-07-13");
    expect(spy).toHaveBeenCalledWith(
      "https://nex.test/en/bookings/fullCalendarEvents?start=2026-07-13&end=2026-07-13",
    );
  });

  it("proxies weather with key and city id", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/weather");
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("id=111");
    expect(url).toContain("APPID=wkey");
    expect(url).toContain("units=imperial");
  });

  it("proxies traffic with key, boundingBox and filters", async () => {
    const spy = stubFetch();
    await request(createApp(cfg)).get("/api/traffic");
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("key=mkey");
    expect(url).toContain("boundingBox=1,2,3,4");
    expect(url).toContain("filters=congestion");
  });
});
```

- [ ] **Step 2: Update `createApp` signature — write `server/src/app.ts`**

```ts
import express, { type Express } from "express";
import { config as defaultConfig, type Config } from "./config.js";
import { registerRoutes } from "./routes.js";

export function createApp(config: Config = defaultConfig): Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  registerRoutes(app, config);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  return app;
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -w server`
Expected: FAIL — cannot find `./routes.js`

- [ ] **Step 4: Write `server/src/routes.ts`**

```ts
import type { Express } from "express";
import type { Config } from "./config.js";
import { proxyJson } from "./proxy.js";

export function registerRoutes(app: Express, config: Config): void {
  app.get("/api/events", (_req, res) =>
    proxyJson(res, `${config.nexudusBase}/events`),
  );

  app.get("/api/space/:date", (req, res) => {
    const date = encodeURIComponent(req.params.date);
    proxyJson(
      res,
      `${config.nexudusBase}/bookings/fullCalendarEvents?start=${date}&end=${date}`,
    );
  });

  app.get("/api/weather", (_req, res) => {
    const { apiKey, cityId } = config.weather;
    proxyJson(
      res,
      `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&units=imperial&APPID=${apiKey}`,
    );
  });

  app.get("/api/traffic", (_req, res) => {
    const { apiKey, boundingBox, filters } = config.traffic;
    proxyJson(
      res,
      `https://www.mapquestapi.com/traffic/v2/incidents?key=${apiKey}&boundingBox=${boundingBox}&filters=${filters}`,
    );
  });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -w server`
Expected: PASS (existing app tests + 4 route tests)

> Note: the URL assertions use unencoded commas for readability; supertest/fetch mock receives the raw string built above, so keep boundingBox/filters unencoded in `routes.ts` exactly as shown.

- [ ] **Step 6: Commit**

```bash
git add server/src
git commit -m "feat(server): events, space, weather, traffic proxy routes"
```

---

### Task 6: Serve the built client in production

**Files:**
- Modify: `server/src/app.ts`
- Test: `server/src/static.test.ts`

**Interfaces:**
- Consumes: existing `createApp`.
- Produces: when `client/dist` exists, static assets + SPA fallback are served; `/api/*` still returns JSON 404 when unmatched.

- [ ] **Step 1: Write the failing test `server/src/static.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("static serving", () => {
  it("keeps /api 404s as JSON", async () => {
    const res = await request(createApp()).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails or passes**

Run: `npm test -w server`
Expected: FAIL — current catch-all 404s every path including future static assets; we must scope the JSON 404 to `/api`.

- [ ] **Step 3: Update `server/src/app.ts`**

```ts
import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as defaultConfig, type Config } from "./config.js";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp(config: Config = defaultConfig): Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  registerRoutes(app, config);

  // Unmatched /api routes are JSON 404s.
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Everything else: serve the built SPA if present.
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) res.status(404).send("Client build not found. Run `npm run build`.");
    });
  });

  return app;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w server`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src
git commit -m "feat(server): serve built client with api-scoped 404s"
```

---

## Phase 2 — Client scaffold & shared types

### Task 7: Scaffold the Vite + React + TS client

**Files:**
- Create: `client/package.json`, `client/tsconfig.json`, `client/tsconfig.node.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`, `client/src/App.tsx`
- Create: `client/src/vite-env.d.ts`
- Test: `client/src/App.test.tsx`

**Interfaces:**
- Produces: a running Vite app rendering `<App />`; dev server proxies `/api` to `http://localhost:8089`.

- [ ] **Step 1: Write `client/package.json`**

```json
{
  "name": "client",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "bootstrap": "^4.6.2",
    "jsdom": "^25.0.1",
    "sass": "^1.81.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `client/tsconfig.json` and `client/tsconfig.node.json`**

`client/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`client/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Write `client/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8089" },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

- [ ] **Step 4: Write `client/src/test/setup.ts` and `client/src/vite-env.d.ts`**

`client/src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`client/src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Write `client/index.html`**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta content="width=device-width, user-scalable=no" name="viewport" />
    <meta name="HandheldFriendly" content="true" />
    <title>City Garage Kiosk</title>
    <link rel="icon" href="/favicon.png" type="image/png" />
  </head>
  <body id="cgKiosk">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write the failing test `client/src/App.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the welcome heading", () => {
    render(<App />);
    expect(screen.getByText(/welcome to/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npm test -w client`
Expected: FAIL — cannot find `./App`

- [ ] **Step 8: Write minimal `client/src/App.tsx` and `client/src/main.tsx`**

`client/src/App.tsx`:
```tsx
export function App() {
  return (
    <div className="container-fluid">
      <h1>Welcome to</h1>
    </div>
  );
}
```

`client/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm test -w client`
Expected: PASS

- [ ] **Step 10: Install workspace deps and commit**

```bash
npm install
git add client
git commit -m "feat(client): scaffold vite+react+ts app"
```

---

### Task 8: Shared API types

**Files:**
- Create: `client/src/types/index.ts`

**Interfaces:**
- Produces: `NexudusEvent`, `NexudusEventsResponse`, `SpaceBooking`, `OwmForecastResponse`, `OwmForecastEntry`, `MapQuestIncident`, `MapQuestTrafficResponse`, `Business`.

> These shapes are inferred from the legacy `main.js` field access and the captured `site/dist/traffic_response*.json`. Verify against live responses during Task 12–15.

- [ ] **Step 1: Write `client/src/types/index.ts`**

```ts
export interface NexudusEvent {
  Id: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  LongDescription: string | null;
  VenueAddress: string | null;
}

export interface NexudusEventsResponse {
  CalendarEvents: NexudusEvent[];
}

export interface SpaceBooking {
  resourceName: string;
}

export interface OwmForecastEntry {
  dt: number;
  main: { temp: number };
  weather: { id: number; main: string }[];
  clouds: { all: number };
}

export interface OwmForecastResponse {
  cod: string;
  list: OwmForecastEntry[];
}

export interface MapQuestIncident {
  id: string;
  type: number;
  severity: number;
  fullDesc: string;
  parameterizedDescription: {
    roadName: string;
    crossRoad1: string;
  };
}

export interface MapQuestTrafficResponse {
  incidents: MapQuestIncident[];
}

export interface Business {
  suite: string;
  company: string;
  company2: string;
  logo1: string;
  logo2: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build -w client`
Expected: no type errors (unused-export warnings are fine; file compiles).

- [ ] **Step 3: Commit**

```bash
git add client/src/types
git commit -m "feat(client): shared api response types"
```

---

## Phase 3 — Pure logic (`lib/`, heavily tested)

### Task 9: Suite → selector mapping

**Files:**
- Create: `client/src/lib/suites.ts`
- Test: `client/src/lib/suites.test.ts`

**Interfaces:**
- Produces: `suiteSelector(id: string | number): string`.

- [ ] **Step 1: Write the failing test `client/src/lib/suites.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { suiteSelector } from "./suites";

describe("suiteSelector", () => {
  it("maps 101–199 to office selectors", () => {
    expect(suiteSelector(105)).toBe(".suite.o-105");
    expect(suiteSelector("101")).toBe(".suite.o-101");
  });
  it("maps everything else to suite selectors", () => {
    expect(suiteSelector(700)).toBe(".suite.s-700");
    expect(suiteSelector("100")).toBe(".suite.s-100");
    expect(suiteSelector(200)).toBe(".suite.s-200");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- suites`
Expected: FAIL — cannot find `./suites`

- [ ] **Step 3: Write `client/src/lib/suites.ts`**

```ts
export function suiteSelector(id: string | number): string {
  const n = Number(id);
  if (n > 100 && n < 200) return `.suite.o-${id}`;
  return `.suite.s-${id}`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- suites`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/suites.ts client/src/lib/suites.test.ts
git commit -m "feat(client): suite selector mapping"
```

---

### Task 10: Event date/time formatting

**Files:**
- Create: `client/src/lib/eventFormat.ts`
- Test: `client/src/lib/eventFormat.test.ts`

**Interfaces:**
- Produces: `formatEventListDate(iso: string): { label: string; time: string }` (list rows, e.g. `Jul 13`, `2:30 PM`) and `formatEventFullDate(iso: string): string` (modal, e.g. `7/13/2026 2:30 PM`).

> Ports the month-abbreviation table and the 12-hour formatting from legacy `getEvents`/`displayAlert`. Uses local time (matches legacy `new Date(...).getHours()`).

- [ ] **Step 1: Write the failing test `client/src/lib/eventFormat.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { formatEventListDate, formatEventFullDate } from "./eventFormat";

describe("formatEventListDate", () => {
  it("formats afternoon events as PM with abbrev month", () => {
    const { label, time } = formatEventListDate("2026-07-13T14:30:00");
    expect(label).toBe("Jul 13");
    expect(time).toBe("2:30 PM");
  });
  it("pads a zero minute", () => {
    const { time } = formatEventListDate("2026-07-13T09:00:00");
    expect(time).toBe("9:00 AM");
  });
});

describe("formatEventFullDate", () => {
  it("formats full m/d/yyyy with time", () => {
    expect(formatEventFullDate("2026-07-13T14:00:00")).toBe("7/13/2026 2:00 PM");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- eventFormat`
Expected: FAIL — cannot find `./eventFormat`

- [ ] **Step 3: Write `client/src/lib/eventFormat.ts`**

```ts
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatTime(d: Date): string {
  const minutes = d.getMinutes() === 0 ? "00" : String(d.getMinutes()).padStart(2, "0");
  const hours24 = d.getHours();
  if (hours24 > 12) return `${hours24 - 12}:${minutes} PM`;
  if (hours24 === 12) return `12:${minutes} PM`;
  return `${hours24}:${minutes} AM`;
}

export function formatEventListDate(iso: string): { label: string; time: string } {
  const d = new Date(iso);
  return { label: `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`, time: formatTime(d) };
}

export function formatEventFullDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${formatTime(d)}`;
}
```

> Behavior note: legacy code printed AM for the noon hour (a bug); this port fixes noon to PM. Acceptable deviation — call out in the PR.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- eventFormat`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/eventFormat.ts client/src/lib/eventFormat.test.ts
git commit -m "feat(client): event date/time formatting"
```

---

### Task 11: Traffic incident → list-item mapping

**Files:**
- Create: `client/src/lib/traffic.ts`
- Test: `client/src/lib/traffic.test.ts`

**Interfaces:**
- Consumes: `MapQuestIncident` (Task 8).
- Produces: `toTrafficItems(incidents): TrafficItem[]` where `TrafficItem = { id, name, displayName, type, severity }`; `displayName` applies the legacy shortening rules.

- [ ] **Step 1: Write the failing test `client/src/lib/traffic.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { toTrafficItems } from "./traffic";
import type { MapQuestIncident } from "../types";

function incident(over: Partial<MapQuestIncident>): MapQuestIncident {
  return {
    id: "1", type: 1, severity: 2, fullDesc: "desc",
    parameterizedDescription: { roadName: "I-95", crossRoad1: "Exit 1" },
    ...over,
  };
}

describe("toTrafficItems", () => {
  it("keeps short road names intact", () => {
    const [item] = toTrafficItems([incident({ parameterizedDescription: { roadName: "I-95", crossRoad1: "x" } })]);
    expect(item.displayName).toBe("I-95");
  });
  it("renames Baltimore Washington Pkwy to MD-295", () => {
    const [item] = toTrafficItems([incident({ parameterizedDescription: { roadName: "Baltimore Washington Pkwy", crossRoad1: "x" } })]);
    expect(item.displayName).toBe("MD-295");
  });
  it("truncates other long names to 5 chars + ellipsis", () => {
    const [item] = toTrafficItems([incident({ parameterizedDescription: { roadName: "Ritchie Highway", crossRoad1: "x" } })]);
    expect(item.displayName).toBe("Ritch...");
  });
  it("carries id, type and severity", () => {
    const [item] = toTrafficItems([incident({ id: "9", type: 4, severity: 3 })]);
    expect(item).toMatchObject({ id: "9", type: 4, severity: 3 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- traffic`
Expected: FAIL — cannot find `./traffic`

- [ ] **Step 3: Write `client/src/lib/traffic.ts`**

```ts
import type { MapQuestIncident } from "../types";

export interface TrafficItem {
  id: string;
  name: string;
  displayName: string;
  type: number;
  severity: number;
}

function shorten(name: string): string {
  if (name.length <= 7) return name;
  if (name === "Baltimore Washington Pkwy") return "MD-295";
  return `${name.substring(0, 5)}...`;
}

export function toTrafficItems(incidents: MapQuestIncident[]): TrafficItem[] {
  return incidents.map((inc) => {
    const name = inc.parameterizedDescription.roadName;
    return { id: inc.id, name, displayName: shorten(name), type: inc.type, severity: inc.severity };
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- traffic`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/traffic.ts client/src/lib/traffic.test.ts
git commit -m "feat(client): traffic incident list mapping"
```

---

### Task 12: Weather forecast averaging

**Files:**
- Create: `client/src/lib/weather.ts`
- Test: `client/src/lib/weather.test.ts`

**Interfaces:**
- Consumes: `OwmForecastResponse` (Task 8).
- Produces: `summarizeForecast(res, now: Date): WeatherSummary` where `WeatherSummary = { today, tomorrow, weekend }` and each is `{ temp: number; precipClass: string }`. `precipClass` mirrors the legacy `precip-<id>` icon rule; `temp` is the rounded mean.

> Ports `getWeather` + `processWeather`. Buckets 3-hour forecast entries into today / tomorrow / weekend (Sat=6, Sun=0), averages `main.temp`, and picks a precip weather-id: snow (600–699) beats rain (500–599) beats the last-seen id.

- [ ] **Step 1: Write the failing test `client/src/lib/weather.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { summarizeForecast } from "./weather";
import type { OwmForecastResponse } from "../types";

function entry(dateIso: string, temp: number, weatherId: number, clouds = 0) {
  return {
    dt: Math.floor(new Date(dateIso).getTime() / 1000),
    main: { temp },
    weather: [{ id: weatherId, main: "x" }],
    clouds: { all: clouds },
  };
}

describe("summarizeForecast", () => {
  it("averages today's temps and rounds", () => {
    const now = new Date("2026-07-13T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [
        entry("2026-07-13T09:00:00", 70, 800),
        entry("2026-07-13T12:00:00", 80, 800),
      ],
    };
    expect(summarizeForecast(res, now).today.temp).toBe(75);
  });

  it("prefers snow id over rain for the precip class", () => {
    const now = new Date("2026-07-13T08:00:00");
    const res: OwmForecastResponse = {
      cod: "200",
      list: [
        entry("2026-07-13T09:00:00", 30, 500),
        entry("2026-07-13T12:00:00", 30, 601),
      ],
    };
    expect(summarizeForecast(res, now).today.precipClass).toBe("precip-601");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- weather`
Expected: FAIL — cannot find `./weather`

- [ ] **Step 3: Write `client/src/lib/weather.ts`**

```ts
import type { OwmForecastResponse, OwmForecastEntry } from "../types";

export interface DayWeather {
  temp: number;
  precipClass: string;
}
export interface WeatherSummary {
  today: DayWeather;
  tomorrow: DayWeather;
  weekend: DayWeather;
}

function summarizeBucket(entries: OwmForecastEntry[]): DayWeather {
  if (entries.length === 0) return { temp: 0, precipClass: "" };
  const sum = entries.reduce((acc, e) => acc + e.main.temp, 0);
  const temp = Math.round(sum / entries.length);

  let snow: number | undefined;
  let rain: number | undefined;
  let last = entries[entries.length - 1].weather[0].id;
  for (const e of entries) {
    const id = e.weather[0].id;
    if (id >= 600 && id < 700) snow = id;
    if (id >= 500 && id < 600) rain = id;
    last = id;
  }
  const precip = snow ?? rain ?? last;
  return { temp, precipClass: `precip-${precip}` };
}

export function summarizeForecast(res: OwmForecastResponse, now: Date): WeatherSummary {
  const todayDate = now.getDate();
  const buckets = { today: [] as OwmForecastEntry[], tomorrow: [] as OwmForecastEntry[], weekend: [] as OwmForecastEntry[] };

  for (const e of res.list) {
    const when = new Date(e.dt * 1000);
    if (when.getDate() === todayDate) buckets.today.push(e);
    if (when.getDate() === todayDate + 1) buckets.tomorrow.push(e);
    const day = when.getDay();
    if ((day === 6 || day === 0) && when.getDate() !== todayDate) buckets.weekend.push(e);
  }

  return {
    today: summarizeBucket(buckets.today),
    tomorrow: summarizeBucket(buckets.tomorrow),
    weekend: summarizeBucket(buckets.weekend),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- weather`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/weather.ts client/src/lib/weather.test.ts
git commit -m "feat(client): weather forecast summarization"
```

---

## Phase 4 — Data access & hooks

### Task 13: Typed API client

**Files:**
- Create: `client/src/api/kiosk.ts`
- Test: `client/src/api/kiosk.test.ts`

**Interfaces:**
- Consumes: types (Task 8).
- Produces: `fetchEvents()`, `fetchWeather()`, `fetchTraffic()`, `fetchSpace(date: string)` — each returns the typed response, throwing on non-ok.

- [ ] **Step 1: Write the failing test `client/src/api/kiosk.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWeather } from "./kiosk";

afterEach(() => vi.restoreAllMocks());

describe("fetchWeather", () => {
  it("GETs /api/weather and returns json", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cod: "200", list: [] }) });
    vi.stubGlobal("fetch", spy);
    const res = await fetchWeather();
    expect(spy).toHaveBeenCalledWith("/api/weather");
    expect(res.cod).toBe("200");
  });
  it("throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    await expect(fetchWeather()).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- kiosk`
Expected: FAIL — cannot find `./kiosk`

- [ ] **Step 3: Write `client/src/api/kiosk.ts`**

```ts
import type {
  NexudusEventsResponse,
  OwmForecastResponse,
  MapQuestTrafficResponse,
  SpaceBooking,
} from "../types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
  return (await res.json()) as T;
}

export const fetchEvents = () => getJson<NexudusEventsResponse>("/api/events");
export const fetchWeather = () => getJson<OwmForecastResponse>("/api/weather");
export const fetchTraffic = () => getJson<MapQuestTrafficResponse>("/api/traffic");
export const fetchSpace = (date: string) => getJson<SpaceBooking[]>(`/api/space/${date}`);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- kiosk`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/api
git commit -m "feat(client): typed kiosk api client"
```

---

### Task 14: `usePolling` hook

**Files:**
- Create: `client/src/hooks/usePolling.ts`
- Test: `client/src/hooks/usePolling.test.tsx`

**Interfaces:**
- Produces: `usePolling<T>(fetcher: () => Promise<T>, intervalMs: number): { data: T | null; error: unknown }`. Fetches immediately on mount, then every `intervalMs`; keeps last good `data` on error.

- [ ] **Step 1: Write the failing test `client/src/hooks/usePolling.test.tsx`**

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
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
    await vi.advanceTimersByTimeAsync(0);
    expect(result.current.data).toBe("first");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result.current.data).toBe("first");
    expect(result.current.error).toBeInstanceOf(Error);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- usePolling`
Expected: FAIL — cannot find `./usePolling`

- [ ] **Step 3: Write `client/src/hooks/usePolling.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- usePolling`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/usePolling.ts client/src/hooks/usePolling.test.tsx
git commit -m "feat(client): usePolling data hook"
```

---

### Task 15: `ScrollList` component + `useAutoScrollReset`

**Files:**
- Create: `client/src/hooks/useAutoScrollReset.ts`
- Create: `client/src/components/ScrollList.tsx`
- Test: `client/src/components/ScrollList.test.tsx`

**Interfaces:**
- Produces: `useAutoScrollReset(ref, idleMs)` — resets `scrollTop` to 0 after `idleMs` idle; `ScrollList({ children })` — renders `<div class="list"><ul>…</ul></div>` with the shadow top/bottom classes toggled on scroll (mirrors legacy `.list` behavior).

- [ ] **Step 1: Write the failing test `client/src/components/ScrollList.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScrollList } from "./ScrollList";

describe("ScrollList", () => {
  it("renders children inside .list > ul", () => {
    render(
      <ScrollList>
        <li>row</li>
      </ScrollList>,
    );
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list.parentElement).toHaveClass("list");
    expect(screen.getByText("row")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- ScrollList`
Expected: FAIL — cannot find `./ScrollList`

- [ ] **Step 3: Write `client/src/hooks/useAutoScrollReset.ts`**

```ts
import { useEffect, type RefObject } from "react";

export function useAutoScrollReset(ref: RefObject<HTMLElement>, idleMs: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { el.scrollTop = 0; }, idleMs);
    };
    el.addEventListener("scroll", onScroll);
    return () => { clearTimeout(timer); el.removeEventListener("scroll", onScroll); };
  }, [ref, idleMs]);
}
```

- [ ] **Step 4: Write `client/src/components/ScrollList.tsx`**

```tsx
import { useRef, useState, type ReactNode } from "react";
import { useAutoScrollReset } from "../hooks/useAutoScrollReset";

export function ScrollList({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  useAutoScrollReset(listRef, 30000);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const bottomPos = el.scrollHeight - el.clientHeight;
    setAtTop(el.scrollTop <= 40);
    setAtBottom(bottomPos <= el.scrollTop + 40);
  };

  const cls = ["list", atTop ? "" : "top", atBottom ? "" : "bottom"].filter(Boolean).join(" ");
  return (
    <div className={cls} ref={listRef} onScroll={onScroll}>
      <ul>{children}</ul>
    </div>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -w client -- ScrollList`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/hooks/useAutoScrollReset.ts client/src/components/ScrollList.tsx client/src/components/ScrollList.test.tsx
git commit -m "feat(client): ScrollList with idle auto-reset"
```

---

## Phase 5 — Styles migration

### Task 16: Port SCSS to Vite with `@use`

**Files:**
- Create: `client/src/styles/main.scss` and partials under `client/src/styles/inc/`, `client/src/styles/parts/`
- Copy assets: `site/img/` → `client/public/img/`, `site/webfonts/` → `client/public/webfonts/`, favicon → `client/public/favicon.png`
- Modify: `client/src/main.tsx` (import styles)

**Interfaces:**
- Produces: compiled CSS visually equal to legacy `site/dist/main.css`; global class names (`.container-fluid`, `.list`, `.suite`, `#weather`, etc.) available to components.

- [ ] **Step 1: Copy static assets into `client/public/`**

```bash
mkdir -p client/public
cp -R site/img client/public/img
cp -R site/webfonts client/public/webfonts
cp site/img/logos/cg_logo-1.svg client/public/img/logos/cg_logo-1.svg 2>/dev/null || true
# favicon referenced by index.html:
cp site/favicon.png client/public/favicon.png 2>/dev/null || true
```

- [ ] **Step 2: Copy SCSS partials, preserving structure**

```bash
mkdir -p client/src/styles/inc client/src/styles/parts
cp src/scss/inc/_*.scss client/src/styles/inc/
cp src/scss/parts/_*.scss client/src/styles/parts/
```

- [ ] **Step 3: Write `client/src/styles/main.scss` using `@use` (replaces legacy `@import`)**

```scss
// Bootstrap grid only (from npm, replaces vendored copy)
@import "bootstrap/scss/functions";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/grid";

@use "inc/globals" as *;
@use "inc/colors" as *;
@use "inc/fonts" as *;

@use "parts/welcome";
@use "parts/weather";
@use "parts/traffic";
@use "parts/events";
@use "parts/map";
@use "parts/dir";
@use "parts/modal";
```

> Bootstrap 4 SCSS still uses `@import`; keep those four `@import` lines for the grid. Convert only the project's own partials to `@use`. If a partial references color/global variables, add its own `@use "../inc/colors" as *;` at the top of that partial so `@use` scoping resolves. Do this per partial as the compiler reports undefined variables.

- [ ] **Step 4: Import styles in `client/src/main.tsx`**

Add as the first import:
```tsx
import "./styles/main.scss";
```

- [ ] **Step 5: Resolve `@use` scoping errors iteratively**

Run: `npm run build -w client`
Expected: build fails first with `Undefined variable` in partials → add `@use "../inc/colors" as *;` / `@use "../inc/globals" as *;` to the top of each offending partial until the build succeeds. Fix deprecated color functions (e.g. `lighten()`/`darken()`) only if the compiler emits deprecation errors, replacing with `color.adjust`.

- [ ] **Step 6: Visual smoke check**

Run: `npm run dev` (root) and open `http://localhost:5173`.
Expected: background gradient, fonts, and layout match the legacy screenshot. (Panels are still placeholders; verify global styling only.)

- [ ] **Step 7: Commit**

```bash
git add client/src/styles client/public
git commit -m "feat(client): migrate SCSS to vite @use, drop CodeKit"
```

---

## Phase 6 — Panels & app assembly

### Task 17: Directory data module + `DirectoryPanel`

**Files:**
- Create: `client/src/data/businesses.ts`
- Create: `client/src/components/DirectoryPanel.tsx`
- Test: `client/src/data/businesses.test.ts`, `client/src/components/DirectoryPanel.test.tsx`

**Interfaces:**
- Consumes: `Business` (Task 8), `suiteSelector` is NOT used here; clicking emits the suite id upward.
- Produces: `businesses: Business[]`; `DirectoryPanel({ onSelectSuite }: { onSelectSuite: (id: string) => void })`.

- [ ] **Step 1: Write `client/src/data/businesses.ts` (ported from `site/dist/businesses.csv`)**

```ts
import type { Business } from "../types";

export const businesses: Business[] = [
  { suite: "100", company: "Lighthouse", company2: "", logo1: "underarmor.svg", logo2: "" },
  { suite: "101", company: "Maven GIG", company2: "", logo1: "maven.svg", logo2: "" },
  { suite: "102", company: "", company2: "", logo1: "", logo2: "" },
  { suite: "103", company: "eThink", company2: "", logo1: "ethink.png", logo2: "" },
  { suite: "104", company: "Towson Watch Company", company2: "", logo1: "towsonwatch.png", logo2: "" },
  { suite: "105", company: "Maven GIG", company2: "", logo1: "maven.svg", logo2: "" },
  { suite: "106", company: "South Baltimore Gateway Partnership", company2: "", logo1: "SBGP_logo.svg", logo2: "" },
  { suite: "107", company: "NetSea", company2: "", logo1: "", logo2: "" },
  { suite: "200", company: "Weller Development", company2: "", logo1: "Development.svg", logo2: "" },
  { suite: "300", company: "WebbMason/Catalyst Labs", company2: "Bully Entertainment", logo1: "Catalystlabs_logo_blacktext.png", logo2: "bullyLogoHome.png" },
  { suite: "400", company: "", company2: "", logo1: "", logo2: "" },
  { suite: "500", company: "Weller Development", company2: "", logo1: "Development.svg", logo2: "" },
  { suite: "600", company: "Balti Virtual", company2: "Hungry Harvest", logo1: "bv_logo.png", logo2: "HHLogo_1C_ORG.jpg" },
  { suite: "700", company: "Ready Robotics", company2: "Launch Port", logo1: "ready-robotics-logo-white.png", logo2: "launchport.png" },
  { suite: "800", company: "Launch Port / Life Sprout", company2: "", logo1: "", logo2: "" },
  { suite: "900", company: "EMS / EMS-B", company2: "", logo1: "", logo2: "" },
  { suite: "1000", company: "Betamore", company2: "", logo1: "", logo2: "" },
];
```

- [ ] **Step 2: Write the failing tests**

`client/src/data/businesses.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { businesses } from "./businesses";

describe("businesses", () => {
  it("has the full directory", () => {
    expect(businesses).toHaveLength(17);
    expect(businesses[0]).toMatchObject({ suite: "100", company: "Lighthouse" });
  });
});
```

`client/src/components/DirectoryPanel.test.tsx`:
```tsx
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
```

- [ ] **Step 3: Run to verify they fail**

Run: `npm test -w client -- Directory businesses`
Expected: FAIL — cannot find `./DirectoryPanel`

- [ ] **Step 4: Write `client/src/components/DirectoryPanel.tsx`**

```tsx
import { businesses } from "../data/businesses";
import { ScrollList } from "./ScrollList";
import type { Business } from "../types";

function Logo({ b }: { b: Business }) {
  if (b.logo1) {
    return (
      <div className="logo">
        <img src={`/img/logos/${b.logo1}`} alt={b.company} />
        {b.logo2 && <img src={`/img/logos/${b.logo2}`} alt={b.company2} />}
      </div>
    );
  }
  return <div className="logo"><h3>{b.company || "Space Available!"}</h3></div>;
}

export function DirectoryPanel({ onSelectSuite }: { onSelectSuite: (id: string) => void }) {
  return (
    <section id="directory" className="col">
      <h2>Company Directory</h2>
      <ScrollList>
        {businesses.map((b) => (
          <li key={b.suite} id={b.suite} onClick={() => onSelectSuite(b.suite)}>
            <Logo b={b} />
            <div className="location">
              <span className="type">Suite</span>
              <span className="num">{b.suite}</span>
            </div>
          </li>
        ))}
      </ScrollList>
    </section>
  );
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npm test -w client -- Directory businesses`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/data client/src/components/DirectoryPanel.tsx client/src/components/DirectoryPanel.test.tsx client/src/data/businesses.test.ts
git commit -m "feat(client): directory data module and panel"
```

---

### Task 18: `WeatherPanel`

**Files:**
- Create: `client/src/components/WeatherPanel.tsx`
- Test: `client/src/components/WeatherPanel.test.tsx`

**Interfaces:**
- Consumes: `usePolling` (14), `fetchWeather` (13), `summarizeForecast` (12).
- Produces: `WeatherPanel()` rendering the `#weather` `<dl>` with today/tomorrow/weekend tiles.

- [ ] **Step 1: Write the failing test `client/src/components/WeatherPanel.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- WeatherPanel`
Expected: FAIL — cannot find `./WeatherPanel`

- [ ] **Step 3: Write `client/src/components/WeatherPanel.tsx`**

```tsx
import { usePolling } from "../hooks/usePolling";
import { fetchWeather } from "../api/kiosk";
import { summarizeForecast, type DayWeather } from "../lib/weather";

function Tile({ label, day }: { label: string; day: DayWeather }) {
  return (
    <>
      <dt className={label.toLowerCase()}>{label}</dt>
      <dd className={`${label.toLowerCase()} forcast`}>
        <i className={day.precipClass} />
        <span>{day.temp} &deg;F</span>
      </dd>
    </>
  );
}

export function WeatherPanel() {
  const { data } = usePolling(fetchWeather, 60000);
  const summary = data ? summarizeForecast(data, new Date()) : null;

  return (
    <section id="weather" className="offset-md-1 col-3">
      <dl>
        {summary && (
          <>
            <Tile label="Today" day={summary.today} />
            <Tile label="Tomorrow" day={summary.tomorrow} />
            <Tile label="Weekend" day={summary.weekend} />
          </>
        )}
      </dl>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- WeatherPanel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/WeatherPanel.tsx client/src/components/WeatherPanel.test.tsx
git commit -m "feat(client): weather panel"
```

---

### Task 19: `TrafficPanel`

**Files:**
- Create: `client/src/components/TrafficPanel.tsx`
- Test: `client/src/components/TrafficPanel.test.tsx`

**Interfaces:**
- Consumes: `usePolling` (14), `fetchTraffic` (13), `toTrafficItems` (11), `MapQuestIncident` (8).
- Produces: `TrafficPanel({ onSelectIncident }: { onSelectIncident: (inc: MapQuestIncident) => void })`.

- [ ] **Step 1: Write the failing test `client/src/components/TrafficPanel.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- TrafficPanel`
Expected: FAIL — cannot find `./TrafficPanel`

- [ ] **Step 3: Write `client/src/components/TrafficPanel.tsx`**

```tsx
import { usePolling } from "../hooks/usePolling";
import { fetchTraffic } from "../api/kiosk";
import { toTrafficItems } from "../lib/traffic";
import { ScrollList } from "./ScrollList";
import type { MapQuestIncident } from "../types";

export function TrafficPanel({ onSelectIncident }: { onSelectIncident: (inc: MapQuestIncident) => void }) {
  const { data } = usePolling(fetchTraffic, 60000);
  const incidents = data?.incidents ?? [];
  const items = toTrafficItems(incidents);

  return (
    <section id="traffic" className="col-3">
      <h2>Travel Information</h2>
      <ScrollList>
        {items.length === 0 ? (
          <li className="type-0 severity-0 tally-0"><i /><span>No Traffic!</span></li>
        ) : (
          items.map((item) => {
            const inc = incidents.find((i) => i.id === item.id)!;
            return (
              <li
                key={item.id}
                id={item.id}
                className={`type-${item.type} severity-${item.severity} tally-1`}
                onClick={() => onSelectIncident(inc)}
              >
                <i />
                <span>{item.displayName}</span>
              </li>
            );
          })
        )}
      </ScrollList>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- TrafficPanel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TrafficPanel.tsx client/src/components/TrafficPanel.test.tsx
git commit -m "feat(client): traffic panel"
```

---

### Task 20: `EventsPanel`

**Files:**
- Create: `client/src/components/EventsPanel.tsx`
- Test: `client/src/components/EventsPanel.test.tsx`

**Interfaces:**
- Consumes: `usePolling` (14), `fetchEvents` (13), `formatEventListDate` (10), `NexudusEvent` (8).
- Produces: `EventsPanel({ onSelectEvent }: { onSelectEvent: (e: NexudusEvent) => void })`.

- [ ] **Step 1: Write the failing test `client/src/components/EventsPanel.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- EventsPanel`
Expected: FAIL — cannot find `./EventsPanel`

- [ ] **Step 3: Write `client/src/components/EventsPanel.tsx`**

```tsx
import { usePolling } from "../hooks/usePolling";
import { fetchEvents } from "../api/kiosk";
import { formatEventListDate } from "../lib/eventFormat";
import { ScrollList } from "./ScrollList";
import type { NexudusEvent } from "../types";

export function EventsPanel({ onSelectEvent }: { onSelectEvent: (e: NexudusEvent) => void }) {
  const { data } = usePolling(fetchEvents, 60000);
  const events = data?.CalendarEvents ?? [];

  return (
    <section id="events" className="col">
      <h2>Event Schedule</h2>
      <ScrollList>
        {events.map((e) => {
          const { label, time } = formatEventListDate(e.StartDate);
          return (
            <li key={e.Id} id={String(e.Id)} onClick={() => onSelectEvent(e)}>
              <div className="date">
                <span className="to">{label}</span>
                <span className="from">{time}</span>
              </div>
              <div className="title">{e.Name}</div>
            </li>
          );
        })}
      </ScrollList>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- EventsPanel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/EventsPanel.tsx client/src/components/EventsPanel.test.tsx
git commit -m "feat(client): events panel"
```

---

### Task 21: `FloorMap`

**Files:**
- Create: `client/src/components/FloorMap.tsx`
- Test: `client/src/components/FloorMap.test.tsx`

**Interfaces:**
- Consumes: `highlightedSuites: string[]` (selectors like `.suite.s-700`).
- Produces: `FloorMap({ highlighted }: { highlighted: string[] })` rendering the legacy `#cgMap .city-garage` grid; a suite div gets the `show` class when its selector is in `highlighted`.

> The legacy markup uses class combos like `suite s-700` and `suite o-101`. Represent each cell with its class list and add `show` when `.suite.s-700` (or `.suite.o-101`) is highlighted.

- [ ] **Step 1: Write the failing test `client/src/components/FloorMap.test.tsx`**

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FloorMap } from "./FloorMap";

describe("FloorMap", () => {
  it("adds show to a highlighted suite", () => {
    const { container } = render(<FloorMap highlighted={[".suite.s-700"]} />);
    const el = container.querySelector(".suite.s-700");
    expect(el).toHaveClass("show");
  });
  it("leaves non-highlighted suites without show", () => {
    const { container } = render(<FloorMap highlighted={[]} />);
    expect(container.querySelector(".suite.s-700")).not.toHaveClass("show");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- FloorMap`
Expected: FAIL — cannot find `./FloorMap`

- [ ] **Step 3: Write `client/src/components/FloorMap.tsx`**

```tsx
const SUITES = [
  "s-200", "s-300", "s-400", "s-500", "s-600", "s-700", "s-800",
  "s-900", "s-900 a", "s-1000",
  "o-101", "o-102", "o-103", "o-104", "o-105", "o-106", "o-107",
];
const CONF = ["classroom", "event", "kitchen", "c-102"];

function isHighlighted(highlighted: string[], baseClass: string): boolean {
  // baseClass e.g. "suite s-700" -> selector ".suite.s-700"
  const selector = "." + baseClass.trim().split(/\s+/).join(".");
  return highlighted.includes(selector);
}

export function FloorMap({ highlighted }: { highlighted: string[] }) {
  return (
    <section id="map" className="col">
      <div id="cgMap">
        <div className="city-garage">
          <div className="are-here">You Are Here</div>
          {SUITES.map((s) => {
            const base = `suite ${s}`;
            const show = isHighlighted(highlighted, base) ? " show" : "";
            return <div key={s} className={`${base}${show}`} />;
          })}
          {CONF.map((c) => (
            <div key={c} className={`conf ${c}`} />
          ))}
          <div className="kitchen" />
          <div className="restrooms r-1" />
          <div className="restrooms r-2" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- FloorMap`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/FloorMap.tsx client/src/components/FloorMap.test.tsx
git commit -m "feat(client): floor map with suite highlighting"
```

---

### Task 22: `AlertModal`

**Files:**
- Create: `client/src/components/AlertModal.tsx`
- Test: `client/src/components/AlertModal.test.tsx`

**Interfaces:**
- Consumes: `formatEventFullDate` (10), `NexudusEvent` and `MapQuestIncident` (8).
- Produces: discriminated `Alert = { kind: "traffic"; data: MapQuestIncident } | { kind: "event"; data: NexudusEvent }`; `AlertModal({ alert, onClose }: { alert: Alert | null; onClose: () => void })`. Renders nothing when `alert` is null; auto-closes after 30s.

- [ ] **Step 1: Write the failing test `client/src/components/AlertModal.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- AlertModal`
Expected: FAIL — cannot find `./AlertModal`

- [ ] **Step 3: Write `client/src/components/AlertModal.tsx`**

```tsx
import { useEffect } from "react";
import { formatEventFullDate } from "../lib/eventFormat";
import type { MapQuestIncident, NexudusEvent } from "../types";

export type Alert =
  | { kind: "traffic"; data: MapQuestIncident }
  | { kind: "event"; data: NexudusEvent };

export function AlertModal({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(onClose, 30000);
    return () => clearTimeout(id);
  }, [alert, onClose]);

  if (!alert) return null;

  return (
    <section className="modal fade alerts show" id="alertDetails" role="dialog" style={{ display: "block" }}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" aria-label="Close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="container-fluid">
              <div className="row">
                <div className="col details">
                  {alert.kind === "traffic" ? (
                    <>
                      <h3 className={`type-${alert.data.type} severity-${alert.data.severity}`}>
                        <i />{alert.data.parameterizedDescription.roadName}
                      </h3>
                      <p>{alert.data.fullDesc}</p>
                      <p>Between: {alert.data.parameterizedDescription.crossRoad1}</p>
                    </>
                  ) : (
                    <>
                      <h3>{alert.data.Name}</h3>
                      <div>
                        <span className="time-start">{formatEventFullDate(alert.data.StartDate)}</span>
                        <span className="time-end">{formatEventFullDate(alert.data.EndDate)}</span>
                      </div>
                      {alert.data.LongDescription && <div>{alert.data.LongDescription}</div>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w client -- AlertModal`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AlertModal.tsx client/src/components/AlertModal.test.tsx
git commit -m "feat(client): react alert modal (replaces bootstrap/jquery)"
```

---

### Task 23: `WelcomePanel` + assemble `App` with shared state

**Files:**
- Create: `client/src/components/WelcomePanel.tsx`
- Modify: `client/src/App.tsx`
- Test: `client/src/App.test.tsx` (extend)

**Interfaces:**
- Consumes: all panels, `AlertModal`, `suiteSelector` (9), `fetchSpace` (13).
- Produces: fully wired kiosk — clicking directory/events/traffic rows drives `selectedAlert` and `highlightedSuites`; today's events auto-highlight their room; 5s highlight timeout.

- [ ] **Step 1: Write `client/src/components/WelcomePanel.tsx`**

```tsx
export function WelcomePanel() {
  return (
    <section id="welcome" className="col-5">
      <h1>Welcome to</h1>
      <img className="logo" src="/img/logos/cg_logo-1.svg" alt="City Garage" />
    </section>
  );
}
```

- [ ] **Step 2: Extend `client/src/App.test.tsx`**

```tsx
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
  });

  it("highlights the map when a directory suite is clicked", async () => {
    stubAllEndpoints();
    const { container } = render(<App />);
    await userEvent.click(screen.getByText("Lighthouse").closest("li")!);
    await waitFor(() => expect(container.querySelector(".suite.s-100")).toHaveClass("show"));
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -w client -- App`
Expected: FAIL — App still renders only the placeholder heading.

- [ ] **Step 4: Write `client/src/App.tsx`**

```tsx
import { useCallback, useState } from "react";
import { WelcomePanel } from "./components/WelcomePanel";
import { WeatherPanel } from "./components/WeatherPanel";
import { TrafficPanel } from "./components/TrafficPanel";
import { EventsPanel } from "./components/EventsPanel";
import { FloorMap } from "./components/FloorMap";
import { DirectoryPanel } from "./components/DirectoryPanel";
import { AlertModal, type Alert } from "./components/AlertModal";
import { suiteSelector } from "./lib/suites";
import type { MapQuestIncident, NexudusEvent } from "./types";

const HIGHLIGHT_MS = 5000;

export function App() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [highlighted, setHighlighted] = useState<string[]>([]);

  const highlightSuite = useCallback((id: string) => {
    const selector = suiteSelector(id);
    setHighlighted([selector]);
    setTimeout(() => setHighlighted((cur) => cur.filter((s) => s !== selector)), HIGHLIGHT_MS);
  }, []);

  const onSelectIncident = (inc: MapQuestIncident) => setAlert({ kind: "traffic", data: inc });
  const onSelectEvent = (e: NexudusEvent) => setAlert({ kind: "event", data: e });

  return (
    <div className="container-fluid">
      <header className="row no-gutters">
        <WelcomePanel />
        <WeatherPanel />
        <TrafficPanel onSelectIncident={onSelectIncident} />
      </header>
      <div className="row main-body">
        <EventsPanel onSelectEvent={onSelectEvent} />
        <FloorMap highlighted={highlighted} />
        <DirectoryPanel onSelectSuite={highlightSuite} />
      </div>
      <AlertModal alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -w client -- App`
Expected: PASS

- [ ] **Step 6: Full client test run + build**

Run: `npm test -w client && npm run build -w client`
Expected: all tests pass; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add client/src
git commit -m "feat(client): assemble kiosk app with shared alert/highlight state"
```

---

### Task 24: Today's-event room auto-highlight

**Files:**
- Modify: `client/src/components/EventsPanel.tsx`
- Test: `client/src/components/EventsPanel.test.tsx` (extend)

**Interfaces:**
- Consumes: `fetchSpace` (13), `suiteSelector` (9).
- Produces: `EventsPanel` gains optional `onRoomsForToday?: (selectors: string[]) => void`; for events dated today it calls `/api/space/:date` and maps booked `resourceName`s that look like suite numbers to selectors.

> Legacy `drawMap` fetched `/api/space/YYYY-M-D` for today's events and toggled rooms. We port the data fetch; the mapping surfaces suite-like resource names to the parent for map highlighting. Non-suite resources (e.g. "Classroom") are ignored for suite highlighting here — a known scope trim from the legacy special-case.

- [ ] **Step 1: Extend `client/src/components/EventsPanel.test.tsx`**

```tsx
it("requests today's space bookings for today's events", async () => {
  const today = new Date();
  const iso = today.toISOString();
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    calls.push(url);
    if (url.includes("/api/events"))
      return Promise.resolve({ ok: true, json: async () => ({ CalendarEvents: [{ Id: 1, Name: "Today Event", StartDate: iso, EndDate: iso, LongDescription: null, VenueAddress: null }] }) });
    return Promise.resolve({ ok: true, json: async () => [] });
  }));
  const { EventsPanel } = await import("./EventsPanel");
  const { render, waitFor } = await import("@testing-library/react");
  render(<EventsPanel onSelectEvent={() => {}} onRoomsForToday={() => {}} />);
  await waitFor(() => expect(calls.some((c) => c.includes("/api/space/"))).toBe(true));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -w client -- EventsPanel`
Expected: FAIL — no `/api/space/` request is made yet.

- [ ] **Step 3: Update `client/src/components/EventsPanel.tsx`**

Add imports and an effect; full updated file:
```tsx
import { useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { fetchEvents, fetchSpace } from "../api/kiosk";
import { formatEventListDate } from "../lib/eventFormat";
import { suiteSelector } from "../lib/suites";
import { ScrollList } from "./ScrollList";
import type { NexudusEvent } from "../types";

interface Props {
  onSelectEvent: (e: NexudusEvent) => void;
  onRoomsForToday?: (selectors: string[]) => void;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function EventsPanel({ onSelectEvent, onRoomsForToday }: Props) {
  const { data } = usePolling(fetchEvents, 60000);
  const events = data?.CalendarEvents ?? [];

  useEffect(() => {
    const todays = events.filter((e) => isToday(e.StartDate));
    if (todays.length === 0 || !onRoomsForToday) return;
    let active = true;
    (async () => {
      for (const e of todays) {
        const d = new Date(e.StartDate);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        try {
          const bookings = await fetchSpace(key);
          if (!active) return;
          const selectors = bookings
            .map((b) => b.resourceName)
            .filter((n) => /^\d+$/.test(n))
            .map((n) => suiteSelector(n));
          if (selectors.length > 0) onRoomsForToday(selectors);
        } catch {
          /* ignore a failed space lookup */
        }
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <section id="events" className="col">
      <h2>Event Schedule</h2>
      <ScrollList>
        {events.map((e) => {
          const { label, time } = formatEventListDate(e.StartDate);
          return (
            <li key={e.Id} id={String(e.Id)} onClick={() => onSelectEvent(e)}>
              <div className="date">
                <span className="to">{label}</span>
                <span className="from">{time}</span>
              </div>
              <div className="title">{e.Name}</div>
            </li>
          );
        })}
      </ScrollList>
    </section>
  );
}
```

- [ ] **Step 4: Wire `onRoomsForToday` in `App.tsx`**

In `App.tsx`, change the `EventsPanel` usage to:
```tsx
<EventsPanel onSelectEvent={onSelectEvent} onRoomsForToday={(selectors) => setHighlighted(selectors)} />
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -w client -- EventsPanel App`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/components/EventsPanel.tsx client/src/App.tsx client/src/components/EventsPanel.test.tsx
git commit -m "feat(client): auto-highlight rooms for today's events"
```

---

## Phase 7 — Tooling, cutover, docs

### Task 25: ESLint + Prettier

**Files:**
- Create: `eslint.config.js` (root, flat config)
- Create: `.prettierrc.json`

**Interfaces:**
- Produces: `npm run lint` and `npm run format` pass on the codebase.

- [ ] **Step 1: Write `.prettierrc.json`**

```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100 }
```

- [ ] **Step 2: Write `eslint.config.js`**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "package.legacy.json"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
);
```

- [ ] **Step 3: Add `@eslint/js` to root devDependencies and install**

```bash
npm install -D @eslint/js -w .
npm install
```

- [ ] **Step 4: Run lint and fix reported issues**

Run: `npm run lint`
Expected: passes (fix any reported unused vars / hook-deps; the intentional `exhaustive-deps` disable in Task 24 is already annotated).

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js .prettierrc.json package.json package-lock.json
git commit -m "chore: add eslint flat config and prettier"
```

---

### Task 26: End-to-end dev smoke test

**Files:** none (verification task).

- [ ] **Step 1: Start both servers**

Run: `npm run dev`
Expected: server logs "Kiosk server running on http://localhost:8089"; Vite serves on 5173.

- [ ] **Step 2: Load the kiosk and verify live data**

Open `http://localhost:5173`. Verify:
- Weather tiles populate (confirms `/api/weather` key valid; if 502, the OpenWeatherMap key needs refreshing — see spec Open Questions).
- Traffic list populates or shows "No Traffic!".
- Events list populates.
- Clicking a directory row highlights the matching suite on the map.
- Clicking a traffic/event row opens the modal; it auto-closes after 30s.

- [ ] **Step 3: Verify production build serves from Express alone**

```bash
npm run build
npm start
```
Open `http://localhost:8089`. Expected: the built SPA loads and `/api/*` returns live data from the same origin (no Vite).

- [ ] **Step 4: Commit any fixes discovered**

```bash
git add -A
git commit -m "fix: address issues found during dev smoke test"
```

> If the OpenWeatherMap or MapQuest keys are dead (502s), stop and ask the user for fresh keys; update `server/.env`. Do not block the rest of cutover on live third-party data.

---

### Task 27: Remove legacy app and update docs

**Files:**
- Delete: `app.js`, `controls/`, `site/`, `src/`, `config.codekit3`, `.browser-refresh-ignore`, `package.legacy.json`, legacy `package-lock.json` if superseded
- Modify: `CLAUDE.md`

**Interfaces:** none.

- [ ] **Step 1: Confirm nothing new references legacy paths**

Run: `grep -rn "controls/\|/site/\|config.codekit3\|browser-refresh" client server --include=*.ts --include=*.tsx || echo "clean"`
Expected: `clean`.

- [ ] **Step 2: Remove legacy files**

```bash
git rm -r app.js controls site src config.codekit3 .browser-refresh-ignore package.legacy.json
```

- [ ] **Step 3: Rewrite `CLAUDE.md` for the new stack**

Replace the Commands and Architecture sections to describe: `npm run dev` (Vite + Express via concurrently), `npm run build` + `npm start` (Express serves built client), `npm test`, `npm run lint`; the `client/` + `server/` workspace layout; the `/api/*` proxy routes; env config in `server/.env`; SCSS compiled by Vite (no CodeKit). Keep the required CLAUDE.md header prefix.

- [ ] **Step 4: Full verification**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy jQuery/CodeKit app; update CLAUDE.md"
```

---

## Self-Review Notes

- **Spec coverage:** monorepo layout (Task 1, 7), Express proxy in TS with 4 routes + error handling + env (Tasks 2–6), native fetch replacing unirest (Task 4), React panels + shared state (Tasks 17–24), pure ported logic tested (Tasks 9–12), SCSS `@use` migration replacing CodeKit + npm Bootstrap grid (Task 16), React modal replacing Bootstrap/jQuery (Task 22), typed businesses data replacing runtime CSV (Task 17), Vitest+RTL and ESLint+Prettier (Tasks throughout + 25), cutover + CLAUDE.md (Task 27). All spec sections map to tasks.
- **Known intentional deviations flagged in-plan:** noon AM→PM fix (Task 10); non-suite room names not highlighted (Task 24); traffic `tally` fixed at 1 (legacy dedup was commented out).
- **Open risks carried from spec:** live API key validity and third-party response drift — surfaced explicitly in Task 26.
