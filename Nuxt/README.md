# BIAB SDK — Nuxt 4 starter

Same generic business site as the other starters, built on **Nuxt 4** (Vue 3 + Nitro). The shape is closest to the Astro + SvelteKit starters: every render runs on Nitro, the SDK lives in `server/utils/`, and the home page is `useFetch`-loaded against a Nitro endpoint that aggregates all the data.

## Why Nuxt's shape is clean

Nuxt 4 has clear conventions for the SDK boundary:

- **`server/utils/biab.ts`** — Nuxt auto-imports this into every Nitro route. It only bundles to the server output. The bearer key never enters the client chunk.
- **`server/api/biab/*.ts`** — file-based Nitro endpoints. One file per HTTP method (`home.get.ts`, `bookings.post.ts`). No router setup.
- **`useFetch`** in the page runs server-side during SSR and reuses the result on the client — no second round-trip. The home payload is one request that fans out five SDK calls server-side.
- **`runtimeConfig`** keeps env values under a non-public namespace by default — they're read at request time, never inlined into the bundle.

```
browser → page request → useFetch('/api/biab/home') → biab.gallery.list(...) → BIAB
        ↘ client event → $fetch('/api/biab/scheduling/slots') → biab.scheduling.getAvailableSlots(...) → BIAB
                                                              ↑
                                                              └ SDK only in server/utils + server/api
```

## Setup

```sh
npm install     # or pnpm / bun
cp .env.example .env
# Fill NUXT_BIAB_API_KEY, NUXT_BIAB_SITE_ID, NUXT_BIAB_PACKAGE_API_BASE_URL

npm run dev
```

Open http://localhost:3000.

For production:

```sh
npm run build
node .output/server/index.mjs
```

The output is a Node server by default; Nitro presets cover Vercel / Cloudflare / Netlify / Deno / Bun / static — set the preset via `NITRO_PRESET=vercel npm run build` or `nuxt.config.ts`.

## What's in each section

| Section | Where it lives | SDK call |
| --- | --- | --- |
| **Hero / About / Services** | `useFetch('/api/biab/home')` reads marketing bundle, passes to component props | `biab.marketing.getPageBundle(...)` |
| **Gallery** | Same endpoint with const-generic field selection | `biab.gallery.list({ limit: 12, fields: [...] as const })` |
| **Blog** | Same endpoint | `biab.blog.listPosts({ limit: 6 })` |
| **Booking** | Event-type list server-rendered; slots + confirm via `/api/biab/scheduling/{slots,bookings}` | `biab.scheduling.listEventTypes()`, `getAvailableSlots(...)`, `confirmBooking(...)` |
| **Contact form** | Form schema server-rendered; submit via `/api/biab/forms/[slug]` | `biab.forms.schema(slug)`, `biab.forms.submit(...)` |

## Adding a new SDK surface

1. **Static section** — add a field to `HomeData` in `server/api/biab/home.get.ts` and a new component that takes the prop.
2. **Interactive surface** — add a new file under `server/api/biab/<route>.<method>.ts` (Nuxt auto-routes based on filename), then `$fetch('/api/biab/<route>', …)` from the Vue component.

## Webhook revalidation (built in)

`server/api/biab/revalidate.post.ts` mounts the SDK's framework-agnostic handler. Register the URL in BIAB at `/dashboard/settings/integrations`, paste the `whsec_…` into `NUXT_BIAB_REVALIDATION_SECRET`, and BIAB POSTs a signed `content.published` event on every publish.

Nuxt SSR re-fetches per request so the callback is a logger today — when you add response caching (Nitro route rules with `cache: true`, Vercel edge `Cache-Tag` purge, etc.), the `onTagsRevalidated` callback is where to wire it.

## Project layout (BIAB-relevant only)

```
.
├── nuxt.config.ts                              # CSS, runtimeConfig
├── server/
│   ├── utils/biab.ts                           # SDK client (auto-imported into server)
│   └── api/biab/
│       ├── home.get.ts                         # Aggregator — parallel SDK fetch
│       ├── revalidate.post.ts                  # Webhook receiver
│       ├── scheduling/
│       │   ├── slots.get.ts
│       │   └── bookings.post.ts
│       └── forms/
│           └── [slug].post.ts                  # Dynamic route
├── app/
│   ├── app.vue                                 # Root layout
│   ├── pages/index.vue                         # useFetch + composes sections
│   ├── components/biab/
│   │   ├── BiabHeader.vue
│   │   ├── BiabFooter.vue
│   │   ├── Hero.vue
│   │   ├── About.vue
│   │   ├── Services.vue
│   │   ├── Gallery.vue
│   │   ├── Blog.vue
│   │   ├── Booking.vue                         # Vue 3 reactivity + watch
│   │   └── ContactForm.vue                     # Vue 3 reactive form
│   └── assets/css/biab-tokens.css              # BIAB CSS variables
├── .env.example
└── package.json
```

## Vue 3 idioms used

- `<script setup lang="ts">` + Composition API throughout
- `defineProps<{ … }>()` for typed component props
- `ref` / `reactive` for client state, `watch` for "re-run when X changes"
- `v-for`, `v-if`, `v-else`, `<template v-if=…>` for control flow
- `v-model` two-way binding on form inputs
- `$fetch` for client-side calls to the Nitro endpoints
- `useFetch` for SSR-aware data loading

The BIAB layer doesn't care which framework lives on top — Vue components just receive plain data from the endpoint and call `$fetch` for mutations.
