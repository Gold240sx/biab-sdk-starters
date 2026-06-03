# BIAB SDK — SvelteKit starter

Same generic business site as the React-Bun / Vanilla-JS / Astro starters, built on **SvelteKit SSR**. The shape is closest to the Astro starter: SvelteKit pages render on the server, so the SDK lives at `src/lib/server/biab.ts` and the page's `+page.server.ts` `load()` function calls it directly.

## Why SvelteKit's shape is clean

SvelteKit has a hard boundary between client and server code: anything under `src/lib/server/` errors at build time if any client-side module imports it. That makes the SDK ergonomics very direct — no proxy, no transport, just call the SDK in `load()`:

```
browser → page request → SvelteKit load() → biab.gallery.list(...) → BIAB Package API
                                          ↑
                                          └ @biab-dev/sdk + bearer key, server-only
```

Five sections render entirely from `load()` data (Hero, About, Services, Gallery, Blog) — no client-side fetch, no spinner, just `<Hero hero={data.hero} />`. Two interactive sections (Booking, ContactForm) talk to SvelteKit `+server.ts` endpoints under `/api/biab/*`.

## Setup

```sh
bun install     # or npm / pnpm
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

bun run dev
```

Open http://localhost:5173.

## What's in each section

| Section | Where it lives | SDK call |
| --- | --- | --- |
| **Hero / About / Services** | `+page.server.ts` `load()` reads marketing bundle, passes to `Hero/About/Services.svelte` | `biab.marketing.getPageBundle(...)` |
| **Gallery** | `+page.server.ts` calls with const-generic field selection | `biab.gallery.list({ limit: 12, fields: [...] as const })` |
| **Blog** | `+page.server.ts` → `Blog.svelte` | `biab.blog.listPosts({ limit: 6 })` |
| **Booking** | Event-type list server-rendered; slots + confirm hit `/api/biab/scheduling/*` | `biab.scheduling.listEventTypes()`, `getAvailableSlots(...)`, `confirmBooking(...)` |
| **Contact form** | Form schema server-rendered; submit hits `/api/biab/forms/[slug]` | `biab.forms.schema(slug)`, `biab.forms.submit(...)` |

## Svelte 5 runes

Components use Svelte 5's runes mode (forced via `svelte.config.js`):

- `let { data }: { data: PageData } = $props();` — typed props
- `let pickedSlot = $state<string | null>(null);` — reactive state
- `$effect(() => { … });` — side effects (e.g. re-load slots when event type changes)

No `onMount`, no `writable()` — pure runes for the BIAB-specific code.

## Webhook revalidation (built in)

`src/routes/api/biab/revalidate/+server.ts` mounts the `@biab-dev/sdk/adapters/revalidate` handler. Register the URL in BIAB at `/dashboard/settings/integrations`, paste the revealed `whsec_…` into `BIAB_REVALIDATION_SECRET`, and the route verifies + invokes the callback on every BIAB publish.

SvelteKit SSR re-fetches per request, so today the callback just logs — when you add response caching (a Vercel `Cache-Tag` purge, CDN tag delete, static rebuild trigger), that callback is where you wire it.

## Adding a new SDK surface

1. **Static section** — add fields to the `load()` return in `+page.server.ts` + a new `.svelte` component that takes the props.
2. **Interactive section** — add a `+server.ts` endpoint under `src/routes/api/biab/<your-route>/` and have the component `fetch()` it.

## Project layout (BIAB-relevant only)

```
src/
├── lib/
│   ├── server/biab.ts                       # SDK client (server-only)
│   └── components/biab/
│       ├── Header.svelte
│       ├── Footer.svelte
│       ├── Hero.svelte
│       ├── About.svelte
│       ├── Services.svelte
│       ├── Gallery.svelte
│       ├── Blog.svelte
│       ├── Booking.svelte                   # Svelte 5 runes, client-driven
│       └── ContactForm.svelte               # Svelte 5 runes, client-driven
└── routes/
    ├── +page.server.ts                      # Parallel SDK fetch in load()
    ├── +page.svelte                         # Composes all sections
    ├── biab-tokens.css                      # BIAB CSS variables
    └── api/biab/
        ├── revalidate/+server.ts            # Webhook receiver
        ├── scheduling/
        │   ├── slots/+server.ts
        │   └── bookings/+server.ts
        └── forms/[slug]/+server.ts
```

## Adapter

The starter uses `@sveltejs/adapter-auto`, which picks the right adapter for your deployment target. To pin one:

```ts
// svelte.config.js
import vercel from '@sveltejs/adapter-vercel';
// or @sveltejs/adapter-node, adapter-cloudflare, etc.

const config = {
  kit: { adapter: vercel() },
};
```

The BIAB layer doesn't change — only the runtime where the SDK calls happen.
