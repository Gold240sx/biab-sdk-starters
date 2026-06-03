# BIAB SDK — Vanilla JS starter

The same generic business site as the React-Bun starter, but with **zero framework** in the browser. Pure HTML + ES modules + DOM. One Bun process serves both the static files and the same-origin `/api/biab/*` proxy.

## Why this exists

Two reasons to keep a no-build starter around:

1. **It's the clearest read of what the browser actually does** — no JSX, no Suspense, no virtual DOM. Each section is a function that takes a parent element and renders into it via `document.createElement`.
2. **The SDK pattern is framework-agnostic.** This template makes that visible: every section calls `biab.X.method(...)` from `/public/biab.js`, which hits same-origin `/api/biab/*`, which the Bun server forwards to BIAB through `@biab-dev/sdk`. The same shape ships in the React, Astro, Nuxt, Svelte, Qwik, T3, and Tanstack starters — only the rendering layer differs.

## Setup

```sh
bun install
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

bun run dev    # auto-reload Bun process serves public/ + /api/biab/*
# or
bun run start  # same, no watcher
```

Open http://localhost:3000.

## How it's wired

```
browser → /api/biab/<route> → Bun (server.ts) → BIAB Package API
        ↑                    ↑
        └ vanilla JS fetch   └ @biab-dev/sdk holds the API key
```

- `server.ts` — Bun HTTP server, instantiates `createBiabClient` once with the bearer key, exposes 8 routes that each wrap one SDK call.
- `public/index.html` — the page shell with anchor divs (`#hero`, `#gallery`, etc).
- `public/biab.js` — vanilla JS client mirroring the SDK's method names. Uses JSDoc `@typedef`s so the IDE gives type hints without a build step.
- `public/sections/*.js` — one module per section. Each exports `render(target)` that paints into a parent element.
- `public/main.js` — entry point; calls every section's `render` against its anchor.

## What's in each section

| Section | SDK call | What it shows |
| --- | --- | --- |
| **Hero / About / Services** | `biab.marketing.getPageBundle({ pageKey: "home" })` | Marketing bundle reads with local fallbacks |
| **Gallery** | `biab.gallery.list({ limit: 12, fields: ["id","src","title","category","blurDataURL"] })` | Field selection — server projects to only those columns |
| **Blog** | `biab.blog.listPosts({ limit: 6 })` | Webhook-invalidated list |
| **Booking** | `biab.scheduling.listEventTypes()` → `getAvailableSlots(...)` → `confirmBooking(...)` | Full Calendly-shape flow |
| **Contact form** | `biab.forms.schema(slug)` → render fields dynamically → `biab.forms.submit(slug, data)` | Schema-driven form, validated server-side via the SDK's `validateFormSubmission` |

## Adding a new SDK surface

One entry in the server route table + one method on the browser client.

1. In `server.ts`, add an entry to the `routes` object: `"GET /api/biab/<your-route>": async (req) => { … return jsonResponse(await biab.X.method(...)); }`.
2. In `public/biab.js`, add a method that hits that path.
3. In a section module, call it inside `render(target)`.

That's the whole loop.

## Project layout

```
.
├── server.ts                       # Bun proxy — the API-key holder
├── public/
│   ├── index.html                  # Page shell
│   ├── styles.css                  # BIAB CSS vars + section styles
│   ├── biab.js                     # Typed browser fetcher (JSDoc)
│   ├── main.js                     # Mounts each section
│   └── sections/
│       ├── hero.js
│       ├── about.js
│       ├── services.js
│       ├── gallery.js              # Field selection
│       ├── blog.js
│       ├── booking.js              # Calendly flow
│       └── contact-form.js         # Forms schema + validator
├── tsconfig.json                   # Server-only TS settings
├── .env.example
└── package.json
```
