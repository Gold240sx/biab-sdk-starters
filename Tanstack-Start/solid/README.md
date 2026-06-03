# BIAB SDK — TanStack Solid Start starter

Same generic business site as the other framework starters, built on **TanStack Solid Start** (Solid.js + TanStack Router + TanStack Start SSR + Nitro). The shape is closest to the Qwik starter: route `loader` for SSR data, `createServerFn` for client-callable RPCs — no separate API endpoint files needed for those.

## Why this shape

TanStack Start's `createServerFn` compiles function bodies as RPC endpoints. The bearer key in `src/lib/biab.ts` is only reachable through `createServerFn` handlers, so the bundler drops it from the client chunk. Solid's signals (`createSignal`, `createEffect`) handle reactive client state with fine-grained updates — no virtual DOM, no rehydration cost.

```
browser → page load → loader() → getHomeData() → biab.gallery.list(...) → BIAB
        ↘ client event → fetchSlots(...) → biab.scheduling.getAvailableSlots(...)
                                          ↑
                                          └ SDK lives only in server-fn scope
```

Five sections (Hero, About, Services, Gallery, Blog) render from data returned by the route's `loader`. Two interactive sections (Booking, ContactForm) use Solid signals + `createServerFn` calls.

## Setup

```sh
npm install     # or bun / pnpm
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

npm run dev     # vite dev --port 3000
```

Open http://localhost:3000.

For production:

```sh
npm run build
npm run start   # node .output/server/index.mjs
```

## What's in each section

| Section | Where it lives | SDK call |
| --- | --- | --- |
| **Hero / About / Services** | `getHomeData` server fn reads marketing bundle, passes props to components | `biab.marketing.getPageBundle(...)` |
| **Gallery** | `getHomeData` with const-generic field selection | `biab.gallery.list({ limit: 12, fields: [...] as const })` |
| **Blog** | `getHomeData` | `biab.blog.listPosts({ limit: 6 })` |
| **Booking** | Event-type list server-rendered; slots + confirm via `fetchSlots` + `confirmBooking` server fns | `biab.scheduling.listEventTypes()`, `getAvailableSlots(...)`, `confirmBooking(...)` |
| **Contact form** | Form schema server-rendered; submit via `submitContactForm` server fn | `biab.forms.schema(slug)`, `biab.forms.submit(...)` |

## Adding a new SDK surface

1. **Static data** — add a field to `HomeData` and the `getHomeData` handler in `src/lib/biab-server-fns.ts`. Pass it through the route loader to a component as a prop.
2. **Interactive RPC** — add another `createServerFn({ method: ... }).validator(...).handler(...)` in `biab-server-fns.ts`. Import and `await` it from any Solid component.

No API route file needed for the RPC case — TanStack Start generates the transport.

## Webhook revalidation (built in)

`src/routes/api/biab/revalidate.tsx` mounts the SDK's framework-agnostic handler via `createServerFileRoute` + `POST`. Register the URL in BIAB at `/dashboard/settings/integrations`, paste the `whsec_…` into `BIAB_REVALIDATION_SECRET`, and BIAB will POST a signed `content.published` event on every publish. The callback in `revalidate.tsx` is where you wire response-level cache purging once you add it.

## Project layout (BIAB-relevant only)

```
src/
├── lib/
│   ├── biab.ts                                # SDK client (server-only)
│   └── biab-server-fns.ts                     # createServerFn RPCs (loader + 3 mutations)
├── components/biab/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Services.tsx
│   ├── Gallery.tsx
│   ├── Blog.tsx
│   ├── Booking.tsx                            # createSignal + createEffect
│   └── ContactForm.tsx                        # createSignal
├── routes/
│   ├── index.tsx                              # Route with loader → composes sections
│   └── api/biab/revalidate.tsx                # Webhook receiver
└── styles.css                                 # Existing tokens + appended BIAB tokens
```

## Solid 1.x idioms used

- `createSignal()` — reactive primitive, returns `[get, set]`
- `createEffect()` — runs when its dependencies (called signals) change; perfect for "re-load slots when event type changes"
- `<For each={...}>` / `<Show when={...}>` — Solid's reactive control flow components
- Component props are reactive — read `props.x` (not destructured) inside JSX
- Event handlers like `onInput`, `onClick` — same shape as React

The BIAB layer doesn't care which framework lives on top — Solid components just receive plain data from the loader and call typed server functions.
