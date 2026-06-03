# BIAB SDK — Remix starter

Same generic business site as the other starters, built on **Remix 2 (Vite + Single Fetch)**. Loaders + actions on the server, hydrated React on the client.

## Why this shape

Remix's `loader` runs on the server for both the initial render and every client-side navigation. That puts the BIAB SDK + the bearer key exactly where they belong:

```
browser → / → Remix loader → biab.X.method(...) → BIAB Package API
                          ↑
                          └ @biab-dev/sdk + bearer key on the server
```

The home route (`app/routes/_index.tsx`) is the whole site. Its `loader` calls `Promise.all([loadHero, loadAbout, loadServices, loadBlog])` in parallel; the section markup reads the loader data. The contact form posts to the route's `action`, which calls `biab.forms.submit(...)`.

No client-side SDK. No env exposed to the browser. Analytics is the one client-side thing, booted from a tiny inline script that reads server-injected config.

## Setup

```sh
pnpm install        # or npm / bun
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL
# Optional: BIAB_PUBLIC_KEY for a narrower analytics-only key

pnpm dev
```

Open <http://localhost:3000>. Without env, every section renders local fallbacks so the page isn't blank.

For production:

```sh
pnpm build
pnpm start
```

## The shape, file-by-file

```
SDK-Starter-Templates/Remix/
├── package.json
├── tsconfig.json
├── vite.config.ts             # Remix vite plugin with v3 future flags
├── .env.example
└── app/
    ├── root.tsx               # HTML shell + analytics bootstrap
    ├── styles.css
    ├── lib/
    │   ├── biab.server.ts     # SDK client (server-only; .server suffix)
    │   └── sdk-sections.server.ts  # per-section load fns + submitContact
    └── routes/
        └── _index.tsx         # the home route — loader + action + JSX
```

Remix's `.server.ts` suffix is enforced by the bundler: code in those files never reaches the client bundle. The SDK + the bearer key are in `biab.server.ts`. The loader functions are in `sdk-sections.server.ts`. The route imports them and Remix tree-shakes the server modules out of the client bundle automatically.

## How a section reads data

```tsx
// app/routes/_index.tsx
export async function loader(_: LoaderFunctionArgs) {
  const [hero, about, services, blog] = await Promise.all([
    loadHero(), loadAbout(), loadServices(), loadBlog(),
  ]);
  return { hero, about, services, blog };
}

export default function Index() {
  const { hero, about, services, blog } = useLoaderData<typeof loader>();
  return (
    <section className="hero">
      <h1>{hero.title}</h1>
      <p>{hero.tagline}</p>
    </section>
  );
}
```

The loader runs on the server. `useLoaderData` returns the typed shape — no fetcher hook, no `useEffect`, no loading state.

## How the contact form works

```tsx
// _index.tsx
export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  return submitContact({
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? ""),
    message: String(fd.get("message") ?? ""),
  });
}

// JSX
<Form method="post">
  <input name="name" required />
  <input name="email" type="email" required />
  <textarea name="message" />
  <button type="submit">Send</button>
</Form>
```

Remix's `<Form method="post">` posts to the same route's `action`. The action calls `biab.forms.submit(...)` and returns `{ ok: true }` or `{ ok: false, reason: "..." }`. The component reads `useActionData()` to render either the thanks message or the form with the error inline. `useNavigation()` gives the "Sending…" state during submission.

## How analytics get loaded

`app/root.tsx`'s loader returns `getAnalyticsConfig()` — the public-safe values (siteId, baseUrl, public key). The root component inlines that as `window.__BIAB_ANALYTICS__` and then runs a tiny `<script type="module">` that dynamically imports `@biab-dev/sdk/analytics-core` and calls `initBiabAnalytics(cfg)`.

Why the indirection: Remix doesn't have built-in env vars for the browser, and Vite's `import.meta.env.VITE_*` would embed the public key into every JS chunk. The server-injected pattern keeps the public key in one well-known DOM location instead.

## Adding a section

Three steps:

1. **Add a load function** to `app/lib/sdk-sections.server.ts`:
   ```ts
   export async function loadGallery() {
     const biab = getBiab();
     if (!biab) return [];
     // ...
   }
   ```
2. **Call it from the route's loader**:
   ```ts
   const [hero, about, services, blog, gallery] = await Promise.all([
     loadHero(), loadAbout(), loadServices(), loadBlog(), loadGallery(),
   ]);
   ```
3. **Render the section** in JSX reading `gallery` from `useLoaderData`.

For a separate page, add `app/routes/blog.$slug.tsx` with its own loader.

## What this starter doesn't ship

- **Authentication.** Add it via a `_auth.tsx` layout route with a loader that throws `redirect("/login")` if the session cookie isn't valid.
- **Cart + checkout.** Add a `cart.tsx` route with `loader` reading `biab.cart.get(...)` + `action` calling `biab.cart.add(...)` / `biab.cart.checkout(...)`.
- **Pagination on the blog.** Add `app/routes/blog._index.tsx` with `?page=2` handling in the loader.

Remix's pattern is "one route file per URL, every route has a loader + action" — every BIAB SDK method maps cleanly to that.
