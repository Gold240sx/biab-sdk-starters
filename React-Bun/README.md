# BIAB SDK — React + Bun starter

A generic business website wired against the **BIAB SDK** (`@biab-dev/sdk`). Use it as a reference for how to consume BIAB data from a pure React SPA. The same canonical site ships across the other framework starters (Astro, Nuxt, Qwik, Svelte, T3-App, Tanstack-Start) — only the **transport** changes per framework.

## The pattern

A pure React SPA has no server, which means there's no safe place to hide an API key from the browser bundle. This template adds a tiny **Bun HTTP proxy** that:

1. Holds `BIAB_API_KEY` server-side and instantiates `createBiabClient` from `@biab-dev/sdk`.
2. Exposes a small set of `/api/biab/*` endpoints — each one is a one-liner wrapper around a single SDK call.
3. In production, serves the Vite-built `dist/` directory; in dev, Vite serves the SPA and forwards `/api/biab/*` to the Bun proxy via `vite.config.ts`.

```
browser → /api/biab/<route> → Bun (server.ts) → BIAB Package API
```

The browser bundle imports types from `@biab-dev/sdk`, but never the runtime — it just hits same-origin paths. The bearer key stays in the Bun process.

## Setup

```sh
bun install
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

bun run dev
```

`bun run dev` starts both processes via `concurrently`:

- **Vite** on http://localhost:5173 (the SPA, with HMR)
- **Bun proxy** on http://localhost:3000 (`/api/biab/*` handler)

Open http://localhost:5173. Vite proxies API calls to the Bun server.

For production:

```sh
bun run build      # tsc + vite build → dist/
bun run preview    # bun server.ts serves dist/ + /api/biab/* on the same port
```

## What's in each section

Every section under `src/components/` exercises one SDK surface:

| Section | SDK call | What it shows |
| --- | --- | --- |
| **Hero / About / Services** | `biab.marketing.getPageBundle({ pageKey: "home" })` | Class A — admin-published marketing content with local fallbacks |
| **Gallery** | `biab.gallery.list({ limit: 12, fields: ["id", "src", "title", "category", "blurDataURL"] as const })` | **Typed field selection** — const-generic narrowing means the server SELECTs only the columns you asked for, and TS types `.map((item) => …)` accordingly |
| **Blog** | `biab.blog.listPosts({ limit: 6 })` | Class A — webhook-invalidated; new posts appear within seconds of publish |
| **Booking** | `biab.scheduling.listEventTypes()` → `getAvailableSlots(slug, { from, to })` → `confirmBooking(...)` | Full Calendly-shape flow end-to-end |
| **Contact form** | `biab.forms.schema(slug)` → render fields dynamically → `biab.forms.submit(slug, data, ...)` | Schema-driven form rendering + client-side validation against the same shape BIAB enforces server-side |

## Adding a new SDK surface

The pattern is uniform: one entry in the server route table + one method on the browser client.

1. In `server.ts`, add a key like `"GET /api/biab/<your-route>"` with a handler that calls one SDK method and returns its JSON.
2. In `src/lib/biab.ts`, add a method that hits that same path.
3. In a component, import and use it.

That's the whole loop.

## Live updates (webhook revalidation)

BIAB ships an on-demand webhook that POSTs to `/api/biab/revalidate` on every publish. For a Next/Astro app, mount the SDK handler at that route and the consumer's cache flushes within seconds. **For this SPA, there's no in-process cache to bust** — each `fetch()` re-runs every time React calls the effect, so the webhook isn't required for freshness. The pattern lives in the Astro/Nuxt/Next starters instead.

If you later add response caching (Vercel edge, Cloudflare KV, etc.), `@biab-dev/sdk/adapters/revalidate` exports a framework-agnostic verifier so you can mount a route that purges your cache layer on publish events.

## Project layout

```
.
├── server.ts                 # Bun HTTP proxy — the API-key holder
├── vite.config.ts            # Vite dev proxy → Bun server
├── src/
│   ├── App.tsx               # Composes the sections
│   ├── lib/biab.ts           # Browser-side typed fetcher (no key)
│   └── components/
│       ├── Hero.tsx
│       ├── About.tsx
│       ├── Services.tsx
│       ├── Gallery.tsx       # Typed field selection
│       ├── Blog.tsx
│       ├── Booking.tsx       # Calendly flow
│       ├── ContactForm.tsx   # Forms schema + validator
│       ├── Header.tsx
│       └── Footer.tsx
└── .env.example
```
