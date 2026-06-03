# BIAB SDK — Qwik City starter

Same generic business site as the other framework starters, built on **Qwik City**. Qwik's contribution is *resumability* — the server renders the page, and the client picks up exactly where the server left off without rehydrating. For the SDK pattern, Qwik gives us the cleanest split between server and client without any explicit boundary code.

## Why Qwik's shape is interesting

Qwik has two built-in primitives that map directly onto the consumer-DX principle:

- **`routeLoader$`** — runs on the server during render. We use it in `src/routes/index.tsx` to fan five SDK calls (`marketing.getPageBundle`, `gallery.list`, `scheduling.listEventTypes`, `blog.listPosts`, `forms.schema`) into a single `Promise.all`. The page renders with the data already resolved.
- **`server$`** — defines a function whose body only ever runs on the server, callable from any client component. We use it inside `Booking.tsx` and `ContactForm.tsx` for slot-fetching, booking confirmation, and form submission. Qwik compiles the call sites into transparent fetches — no API endpoint files needed.

The `$` suffix on both is Qwik's marker that everything *inside* is server-only and serializable. The bearer key in `src/lib/biab.ts` is only imported from `$`-wrapped functions, so Qwik's optimizer drops it from the browser bundle.

```
browser → page load → routeLoader$()        → biab.gallery.list(...) → BIAB
        ↘ client click → server$()          → biab.scheduling.confirm(...) → BIAB
                                            ↑
                                            └ @biab-dev/sdk lives only in server$ scope
```

## Setup

```sh
bun install     # or npm / pnpm
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

bun run dev
```

Open the URL Vite prints. The home page composes every section; on first paint the data is already there (no spinners) because `routeLoader$` resolved on the server.

For production:

```sh
bun run qwik add <adapter>    # node-server | vercel-edge | cloudflare-pages | …
bun run build
```

## What's in each section

| Section | Where it lives | SDK call |
| --- | --- | --- |
| **Hero / About / Services** | `routeLoader$` reads marketing bundle, passes to component props | `biab.marketing.getPageBundle(...)` |
| **Gallery** | `routeLoader$` with const-generic field selection | `biab.gallery.list({ limit: 12, fields: [...] as const })` |
| **Blog** | `routeLoader$` → `<Blog />` | `biab.blog.listPosts({ limit: 6 })` |
| **Booking** | Event-type list from `routeLoader$`; slot fetch + confirm via `server$` RPCs declared inside `Booking.tsx` | `biab.scheduling.listEventTypes()`, `getAvailableSlots(...)`, `confirmBooking(...)` |
| **Contact form** | Form schema from `routeLoader$`; submit via `server$` inside `ContactForm.tsx` | `biab.forms.schema(slug)`, `biab.forms.submit(...)` |

## Adding a new SDK surface

Two patterns, both clean:

1. **Static data (loaded once per page render)** — add fields to the `useBiabData` `routeLoader$` return in `src/routes/index.tsx`, and pass them as props to a new component.
2. **Interactive RPC (client event triggers a fresh server call)** — declare `const myCall = server$(async function (args) { … })` at the top of the component file, then call `await myCall(args)` from inside any `$()`-wrapped handler.

No API endpoint files needed for the second case — Qwik generates the transport.

## Webhook revalidation (built in)

`src/routes/api/biab/revalidate/index.ts` mounts the SDK's framework-agnostic handler via `onPost`. Register the URL in BIAB at `/dashboard/settings/integrations`, paste the `whsec_…` into `BIAB_REVALIDATION_SECRET`, and BIAB will POST a signed `content.published` event on every publish.

Qwik re-runs `routeLoader$` per request so the callback is a logger today — when you add response-level caching (Vercel `Cache-Tag` purge, Cloudflare KV, etc.), the `onTagsRevalidated` callback in `revalidate/index.ts` is where to wire it.

## Project layout (BIAB-relevant only)

```
src/
├── lib/biab.ts                                # SDK client (server-only)
├── global.css                                 # BIAB CSS vars + section styles
├── components/biab/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Services.tsx
│   ├── Gallery.tsx
│   ├── Blog.tsx
│   ├── Booking.tsx                            # useSignal + server$ RPCs
│   └── ContactForm.tsx                        # useSignal + server$ RPC
└── routes/
    ├── index.tsx                              # routeLoader$ + composes sections
    └── api/biab/revalidate/index.ts           # Webhook receiver
```

## Adapters

Out of the box this starter has no production adapter. Pick one:

```sh
npm run qwik add node-server
npm run qwik add vercel-edge
npm run qwik add cloudflare-pages
npm run qwik add netlify-edge
```

The BIAB layer doesn't change — only the runtime where `routeLoader$` and `server$` execute.
