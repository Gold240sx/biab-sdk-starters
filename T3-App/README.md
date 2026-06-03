# BIAB SDK — T3 App starter

Same generic business site as the other framework starters, built on the **T3 Stack** (Next.js App Router + tRPC + Drizzle + Tailwind). The unique shape here is **tRPC for the SDK surface** — instead of REST endpoints or server functions, every BIAB call is a typed tRPC procedure with end-to-end type inference into the React components.

## Why T3's shape is interesting

T3's whole identity is end-to-end type safety. For the BIAB integration that means:

- **One `biabRouter`** declares every SDK call as a tRPC procedure. Inputs validated with Zod, returns inferred. The TypeScript that flows from the SDK in `src/server/lib/biab.ts` through the tRPC router to the React components is unbroken — no type-script-shaped fetch wrappers, no manual response types.
- **Server Components call procedures directly** via `api.biab.home()`. No HTTP round-trip — the procedure runs in the same Node process as the page render.
- **Client Components use the tRPC react hooks** (`useQuery`, `useMutation`) — fully typed inputs, fully typed responses, optimistic updates and refetches handled by the existing TanStack Query layer the T3 template already wires up.
- **`src/server/lib/biab.ts`** uses `import "server-only";` so Next throws a build error if any client component imports it. The bearer key is impossible to leak.

```
browser → Server Component → api.biab.home() → biabRouter.home → biab.gallery.list(...) → BIAB
        ↘ Client Component → api.biab.confirmBooking.useMutation → biab.scheduling.confirmBooking(...)
                                                                  ↑
                                                                  └ SDK only in src/server/
```

## Setup

```sh
pnpm install     # or npm / bun
cp .env.example .env
# Fill DATABASE_URL + BIAB_API_KEY + BIAB_SITE_ID + BIAB_PACKAGE_API_BASE_URL

pnpm dev
```

Open http://localhost:3000.

For production:

```sh
pnpm build
pnpm start
```

## What's in each section

| Section | Where it lives | SDK call |
| --- | --- | --- |
| **Hero / About / Services** | `api.biab.home()` (server) reads marketing bundle, passes to React components | `biab.marketing.getPageBundle(...)` |
| **Gallery** | Same `api.biab.home()` with const-generic field selection | `biab.gallery.list({ limit: 12, fields: [...] as const })` |
| **Blog** | Same `api.biab.home()` | `biab.blog.listPosts({ limit: 6 })` |
| **Booking** | Event-type list from `home()`; slots via `api.biab.fetchSlots.useQuery`, confirm via `api.biab.confirmBooking.useMutation` | `biab.scheduling.listEventTypes()`, `getAvailableSlots(...)`, `confirmBooking(...)` |
| **Contact form** | Form schema from `home()`; submit via `api.biab.submitForm.useMutation` | `biab.forms.schema(slug)`, `biab.forms.submit(...)` |

## Adding a new SDK surface

One pattern, two halves:

1. **Server** — add a procedure to `src/server/api/routers/biab.ts`:
   ```ts
   myNewCall: publicProcedure
     .input(z.object({ ... }))
     .query(async ({ input }) => {
       const biab = getBiab();
       return await biab.x.y(input);
     }),
   ```
2. **Client** — call it from a component:
   - Server Component: `await api.biab.myNewCall({...})`
   - Client Component: `api.biab.myNewCall.useQuery({...})` or `.useMutation()`

That's it. tRPC handles transport + types end-to-end.

## Webhook revalidation (built in)

`src/app/api/biab/revalidate/route.ts` is one line:

```ts
export { POST } from "@biab-dev/sdk/next/revalidate";
```

The SDK handler reads `BIAB_REVALIDATION_SECRET` from env, verifies the HMAC, and calls Next's `revalidateTag(...)`. Register the URL at BIAB → Settings → Integrations and paste the revealed `whsec_…` into your env.

Since this starter uses `export const dynamic = "force-dynamic"` on the home page, every request re-renders server-side — the webhook is the right wiring for once you add cache-tag-based ISR.

## Project layout (BIAB-relevant only)

```
.
├── src/
│   ├── env.js                                    # +4 BIAB env vars
│   ├── server/
│   │   ├── lib/biab.ts                           # SDK client ("server-only")
│   │   └── api/
│   │       ├── root.ts                           # registers biabRouter
│   │       └── routers/biab.ts                   # tRPC procedures (4: home + 3 RPCs)
│   ├── app/
│   │   ├── page.tsx                              # Server Component composes sections
│   │   ├── _components/biab/
│   │   │   ├── Header.tsx                        # static
│   │   │   ├── Footer.tsx                        # static
│   │   │   ├── Hero.tsx                          # server-render
│   │   │   ├── About.tsx                         # server-render
│   │   │   ├── Services.tsx                      # server-render
│   │   │   ├── Gallery.tsx                       # server-render, field selection
│   │   │   ├── Blog.tsx                          # server-render
│   │   │   ├── Booking.tsx                       # "use client" + tRPC hooks
│   │   │   └── ContactForm.tsx                   # "use client" + tRPC hooks
│   │   └── api/biab/revalidate/route.ts          # one-liner webhook receiver
│   └── styles/globals.css                        # Tailwind + appended BIAB tokens
├── .env.example
├── README.md
└── package.json
```

The BIAB layer plugs into the existing T3 conventions cleanly — the tRPC client/server boundary, the Drizzle DB layer, the Tailwind setup all stay as-is.
