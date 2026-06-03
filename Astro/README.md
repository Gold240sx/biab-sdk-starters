# BIAB SDK — Astro starter

Same generic business site as the React-Bun and Vanilla-JS starters, built on **Astro SSR**. The data fetch pattern is the cleanest of any framework — no separate proxy process, no in-browser SDK client. Each `.astro` component renders on the server and calls `biab.X.method(...)` directly during render.

## Why this shape

Astro's `output: "server"` mode runs every page render on the Node server (or Vercel / Cloudflare / Netlify edge — swap the adapter in `astro.config.mjs`). That puts the SDK exactly where it should be:

```
browser → page request → Astro renders → biab.gallery.list(...) → BIAB Package API
                                       ↑
                                       └ @biab-dev/sdk + bearer key on the server
```

Five sections are pure server-render — zero JavaScript in the browser bundle for the page itself:

- **Hero / About / Services** read the marketing bundle and fall back to local defaults
- **Gallery** uses typed const-generic field selection
- **Blog** lists posts via `biab.blog.listPosts(...)`

Two sections need client interactivity, so they ship a tiny inline `<script>` "island" that talks to Astro endpoints (which themselves call the SDK):

- **Booking** — calls `/api/biab/scheduling/slots` and `/api/biab/scheduling/bookings`
- **ContactForm** — posts to `/api/biab/forms/[slug]`

## Setup

```sh
npm install     # or bun install / pnpm install
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

npm run dev
```

Open http://localhost:4321 (Astro's default dev port). Each section either:
- Renders inline with the SDK data on first paint (no flash, no spinner), or
- Renders an empty-state with a hint to author the content in BIAB.

For production:

```sh
npm run build      # → ./dist
npm run preview    # node ./dist/server/entry.mjs
```

## What's in each section

| Section | SDK call | Render strategy |
| --- | --- | --- |
| **Hero / About / Services** | `biab.marketing.getPageBundle({ pageKey: "home" })` | Server-only, on initial render |
| **Gallery** | `biab.gallery.list({ limit: 12, fields: ["id","src","title","category","blurDataURL"] as const })` | Server-only, typed const-generic field selection |
| **Blog** | `biab.blog.listPosts({ limit: 6 })` | Server-only |
| **Booking** | `biab.scheduling.listEventTypes()` server-render, then `/api/biab/scheduling/slots` + `/bookings` from a client island | Hybrid — list rendered server-side; slots + confirm interactive |
| **Contact form** | `biab.forms.schema(slug)` server-render, then `/api/biab/forms/[slug]` POST from the client island | Hybrid — schema rendered server-side; submit interactive |

## Webhook revalidation (built in)

`src/pages/api/biab/revalidate.ts` mounts the `@biab-dev/sdk/adapters/revalidate` handler. Register this URL in BIAB at `/dashboard/settings/integrations`, paste the revealed `whsec_…` into `BIAB_REVALIDATION_SECRET`, and the route verifies + invokes the callback on every BIAB publish.

Astro SSR re-fetches on every render so the callback is a no-op logger today; when you add response-level caching (Vercel Edge `Cache-Tag` purge, CDN tag delete, static-rebuild trigger), that callback is where you wire it.

## Adding a new SDK surface

Two patterns:

1. **Server-only section** (read happens during render, no client JS): add a new `.astro` component that imports `biab` from `../lib/biab` and calls a method in the frontmatter. Include the result in the template.
2. **Interactive section** (needs a client island): add an Astro endpoint under `src/pages/api/biab/<your-route>.ts` that wraps the SDK call, then have the component's `<script>` block `fetch()` it.

## Project layout

```
.
├── astro.config.mjs                # output: "server", Node adapter
├── src/
│   ├── lib/biab.ts                 # Server-side createBiabClient
│   ├── styles/global.css           # BIAB tokens + section styles
│   ├── components/
│   │   ├── Header.astro            # Static
│   │   ├── Footer.astro            # Static
│   │   ├── Hero.astro              # Server-render
│   │   ├── About.astro             # Server-render
│   │   ├── Services.astro          # Server-render
│   │   ├── Gallery.astro           # Server-render, field selection
│   │   ├── Blog.astro              # Server-render
│   │   ├── Booking.astro           # Server-render shell + client island
│   │   └── ContactForm.astro       # Server-render schema + client island
│   └── pages/
│       ├── index.astro             # Composes everything
│       └── api/biab/
│           ├── revalidate.ts       # Webhook receiver
│           ├── scheduling/
│           │   ├── slots.ts        # GET — compute available slots
│           │   └── bookings.ts     # POST — confirm a booking
│           └── forms/
│               └── [slug].ts       # POST — submit a form
├── .env.example
└── package.json
```

## Swapping the adapter

The starter ships with `@astrojs/node` for portability. To deploy elsewhere, swap the adapter in `astro.config.mjs`:

```ts
// Vercel
import vercel from "@astrojs/vercel";
export default defineConfig({ output: "server", adapter: vercel() });

// Cloudflare
import cloudflare from "@astrojs/cloudflare";
export default defineConfig({ output: "server", adapter: cloudflare() });
```

The component layer doesn't change — only the runtime where the SDK calls happen.
