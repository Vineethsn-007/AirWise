# AirWise

GenAI-powered urban air quality assistant for **PromptWars Virtual Challenge 06**. Families get a live AQI reading, a low-emission daily routine, indoor-air guidance, sustainable swaps, and a plain-language health explanation — all grounded in real data and published tables.

## Problem statement alignment

The challenge asks for an assistant that helps families navigate severe winter smog and urban pollution with low-emission routines, indoor-air hacks, and sustainable alternatives, while explaining the direct impact of choices. AirWise implements all three, plus professional personalisation through a household profile and a 48-hour forecast planner.

| Judging parameter | How AirWise addresses it | Evidence |
| --- | --- | --- |
| **Code Quality** | Next.js 15 App Router, TypeScript strict, ESLint + Prettier, no file over ~200 lines, one typed `reason(intent, context)` entry point, named prompt-template functions in `lib/ai/prompts`, zero `any` in `lib/ai` or `lib/air-quality`. | `npm run lint`, `npm run typecheck`, `npm run build` all pass. |
| **Security** | Zod validation on both API routes; no client-supplied AQI numbers are trusted — the server re-fetches live data; numeric-claim guard rejects any numeral the model did not receive in verified facts; rate limits; no `dangerouslySetInnerHTML`; API key server-side only; no bypass credentials. | `tests/integration/*`, `tests/unit/guard.test.ts`. |
| **Efficiency** | Per-location 5-minute Open-Meteo cache with in-flight coalescing, 5-minute recommendation memo, token streaming over SSE, SVG/CSS-only visuals, no media assets, 103 kB shared first-load JS. | `npm run build` route sizes; cache integration tests. |
| **Testing** | 50 Vitest tests (unit, integration, a11y) + Playwright E2E with axe-core per page. | `npm test`, `npm run test:coverage`, `npm run test:e2e`. |
| **Accessibility** | WCAG 2.1 AA: keyboard-operable forms, visible focus rings, text labels paired with every severity colour, `aria-label` on the AQI badge and icon buttons, live regions for streamed output, skip link, `prefers-reduced-motion`, plain-language mode. | `tests/a11y/components.test.tsx`, Playwright axe scans on `/`, `/plan`, `/profile`. |
| **Problem Statement Alignment** | Real Open-Meteo AQI/geocoding feeds, EPA AirNow categories, deterministic UK-government emissions factors, LLM used only for personalised wording. | Live `/api/air-quality` response; `tests/integration/air-quality.test.ts`. |

## Architecture

```mermaid
flowchart LR
  U[Browser] -->|city / geolocation| AQ[/api/air-quality]
  AQ --> G[Open-Meteo Geocoding]
  AQ --> O[Open-Meteo Air Quality / CAMS]
  AQ --> C[(5-min TTL cache)]
  U -->|intent + location + profile| R[/api/reason]
  R --> AQ
  R --> F[lib/air-quality deterministic tables]
  R --> AI[lib/ai reason()]
  AI --> P[named prompt templates]
  AI --> OR[OpenRouter gpt-oss-120b:free -> openrouter/free]
  OR -->|SSE tokens| U
  R -->|SSE result| U
```

Single server-side orchestration module: `lib/ai/reason.ts` exports `reason(intent, context): Promise<Recommendation>`. Every feature calls it through `/api/reason`; no component fetches the LLM directly.

## Data-source disclosure

| Data | Source | Nature |
| --- | --- | --- |
| Current + 48 h US AQI, PM2.5, PM10, gas concentrations | Open-Meteo Air Quality API (CAMS global/european ensembles) | **Real, live, free, no key** — fetched server-side, cached 5 min. |
| City → coordinates | Open-Meteo Geocoding API (GeoNames) | **Real, live, free, no key** — cached 30 min. |
| AQI category, health guidance | US EPA AirNow published category table (`lib/air-quality/breakpoints.ts`) | Deterministic published facts, computed in code. |
| CO2e savings | UK Government 2026 conversion factors (petrol car 0.20751 kg/vehicle-km, rail 0.03989 kg/passenger-km, local bus 0.0965 kg/passenger-km, EV 0.04 kg/vehicle-km) | Deterministic fixed factors, computed in code. |
| Best outdoor windows, trend | Deterministic scoring over the fetched hourly forecast | Computed in code from live values. |
| Household sensitivities, activities, indoor conditions, commute | User input via `/profile`, stored in this browser's localStorage | User-derived; never sent as "facts" to the model without server verification. |
| Natural-language wording | OpenRouter LLM | **Only** rephrases the verified facts; it never supplies a number, threshold, or health claim. |

If the numeric-claim guard fires twice, AirWise falls back to deterministic wording assembled from the same verified facts and labels that output `deterministic-fallback`. It never invents a "complete-looking" answer.

## Setup

```bash
npm install
cp .env.example .env.local
# add OPENROUTER_API_KEY=... to .env.local  (server-side only; free models still need a key)
npm run dev
```

Open <http://localhost:3000>. A location is prefilled (Delhi) so the live AQI badge appears immediately; search any city or use geolocation. The LLM cards require the key; `/api/air-quality` and the deterministic impact explainer work without it. `/api/reason` returns an explicit `503` when the key is missing.

Deploy to Vercel with `OPENROUTER_API_KEY` set as a server environment variable. Never prefix it with `NEXT_PUBLIC_`.

### Live verification commands

```bash
# Real geocoding + real AQI from Open-Meteo
curl "http://localhost:3000/api/air-quality?city=London"

# Real geocoding + real AQI + real LLM answer (needs key)
curl -X POST http://localhost:3000/api/reason \
  -H 'Content-Type: application/json' \
  -d '{"intent":"routine","location":{"name":"Delhi","latitude":28.6139,"longitude":77.209,"timezone":"Asia/Kolkata"},"profile":{"sensitivities":["children"],"activities":["schoolRun"],"indoor":{"gasStove":true,"noAc":false,"pets":false,"purifier":false},"commute":{"mode":"car","distanceKm":8,"occupants":1,"tripsPerWeek":5},"plainLanguage":true}}'
```

## Testing

```bash
npm test              # 50 Vitest tests
npm run test:coverage # v8 coverage summary
npm run test:e2e      # Playwright flow + axe-core scans (starts dev server)
```

Playwright is pinned to `1.65.0` (Chromium revision `1254`) with a `playwright-core` override so the E2E suite runs with a locally cached browser; newer 1.65.x downloads were hitting CDN connection resets. Current run: **4 passed, 1 skipped** — the real-LLM routine test skips until `OPENROUTER_API_KEY` is set.

Coverage (`npm run test:coverage`): **90.02% statements**, 74.35% branches, 87.93% functions across `lib/**`. The highest-value files are fully covered: EPA breakpoints 97.9%, emissions 100%, health mapping 100%, all prompt builders 100%, validation schemas 100%.

- `tests/unit` — AQI boundaries, pollutant sub-index interpolation, emissions arithmetic, forecast ranking, prompt builders, numeric-claim guard.
- `tests/integration` — both routes, request validation, caching, upstream failure, model fallback, SSE streaming.
- `tests/a11y` — axe-core scans on rendered data components.
- `tests/e2e` — location entry → real AQI value → personalised routine (skips when no key is set) plus WCAG 2.1 AA scans on every page.

## Design decisions

- **Palette:** air-quality semantics — clear-sky blue/white for good states, amber/grey/red as AQI worsens (chosen over the prior "Substance Lab" forest-green token set so colour communicates severity).
- **Sensitivities:** children, older adults, asthma/respiratory, outdoor workers, pregnancy, heart/cardiovascular.
- **Accent:** one italic display-serif word per headline; geometric sans for body and data; capsule actions and badges throughout.
- **Repo size:** no media, SVG/CSS visuals only, build output and dependencies ignored. Working ceiling 10 MB, single branch (PromptWars submission rule).

## Limitations

- The in-process cache and rate limiter are per-instance; use a shared store when scaling to multiple Vercel regions.
- `openai/gpt-oss-120b:free` is attempted first as specified; OpenRouter's public model list may not advertise the `:free` suffix, so `openrouter/free` provides automatic zero-cost fallback.
- AQI is forecast-model data at ~45 km global resolution, not a neighbourhood monitor reading. The UI says so in the footer.
