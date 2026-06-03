# BIAB SDK — HTMX starter

Same generic business site as the other starters, built on **HTMX + Bun** with zero client-side JavaScript framework. Every section is server-rendered HTML; the browser asks for fragments and HTMX swaps them in.

## Why this shape

HTMX inverts the usual "build a JS app, fetch JSON" pattern:

```
browser → hx-get /sections/hero → Bun server → BIAB SDK → HTML fragment → swap
```

No bundler, no hydration step, no client-side state library. The same Bun server that holds the BIAB API key renders every section as HTML and returns it. The browser only ever sees HTML — your BIAB bearer key never leaves the server.

Five sections render server-side with the BIAB data:

- **Hero / About / Services** read the marketing bundle (Services also reads the product catalog) and fall back to local defaults
- **Blog** lists posts via `biab.blog.listPosts(...)`
- **Header / Footer** are pure static

One section is browser-interactive — and HTMX handles it without a single line of JS:

- **ContactForm** — `hx-post="/sections/contact" hx-target="this" hx-swap="outerHTML"` posts the form to the server, the server calls `biab.forms.submit(...)`, and the server returns the "thanks" fragment (or a re-rendered form with an error). The form swaps itself in place.

Analytics boots from a tiny `<script type="module">` that dynamically imports `@biab-dev/sdk/analytics-core` from esm.sh once the page loads. Config is injected into the HTML shell server-side, so no env-reading code lives in the static file.

## Setup

```sh
bun install
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

bun run dev
```

Open <http://localhost:3000>. Sections load progressively as HTMX fires each `hx-get`. Without BIAB env configured, every section renders its local defaults (no crash, no blank page).

For production:

```sh
bun run start
```

## The shape, file-by-file

```
SDK-Starter-Templates/HTMX/
├── package.json
├── tsconfig.json
├── server.ts                  # Bun server — routes /sections/*, serves /public/*
├── public/
│   ├── index.html             # HTMX shell — every region is hx-get-driven
│   └── styles.css             # shared section/card/btn styles
└── src/
    ├── biab.ts                # SDK client factory (server-only)
    ├── html.ts                # tag template helper with auto-escaping
    └── sections/
        ├── header.ts          # also exports renderFooter()
        ├── hero.ts
        ├── about.ts
        ├── services.ts
        ├── blog.ts
        └── contact-form.ts    # GET form + POST handler
```

## How a section renders

```ts
// src/sections/hero.ts
export async function renderHero(): Promise<string> {
  let hero = defaults;
  const biab = getBiab();
  if (biab) {
    try {
      const bundle = await biab.marketing.getPageBundle({
        pageKey: "home", locale: "en",
      });
      // ...read bundle.sections.hero...
    } catch { /* keep defaults */ }
  }
  return render(html`
    <section class="hero" id="hero">
      <h1 class="hero__title">${hero.title}</h1>
      <p class="hero__sub">${hero.tagline}</p>
      <a class="biab-btn" href="${hero.ctaHref}">${hero.ctaLabel}</a>
    </section>
  `);
}
```

`html` is a tiny tag function that escapes every interpolation by default. `render()` returns the final HTML string. Pre-built HTML can be inlined via `raw(...)` or by nesting another `html` call.

## How forms work without JavaScript

```html
<form hx-post="/sections/contact" hx-target="this" hx-swap="outerHTML">
  <input name="name" required />
  <input name="email" type="email" required />
  <textarea name="message"></textarea>
  <button type="submit">Send</button>
</form>
```

The browser posts the form to `/sections/contact`. The Bun handler reads the `FormData`, calls `biab.forms.submit({ slug: "contact", fields: {...} })`, and returns either a "thanks" fragment or a re-rendered form with the error inline. HTMX swaps the response into the spot where the form was.

If you've used Rails or Django Server-Sent Forms, the pattern feels identical — except the server is Bun + the BIAB SDK, and the swap is HTMX-mediated rather than a full page reload.

## How analytics get loaded

The Bun server injects the BIAB analytics config into the shell HTML right before `</body>`:

```html
<script>window.__BIAB_ANALYTICS__={"siteId":"...","baseUrl":"...","apiKey":"..."};</script>
```

A `<script type="module">` already in the shell reads that config and dynamically imports `@biab-dev/sdk/analytics-core` from esm.sh — only when env is configured. DNT + GPC are honoured by the SDK; no cookies are set.

For production you'd probably swap the esm.sh import for a self-hosted bundle, but for a starter, the CDN import keeps the build step at zero.

## Adding a section

Three steps:

1. **Write the renderer** in `src/sections/your-thing.ts`:
   ```ts
   export async function renderYourThing(): Promise<string> { ... }
   ```
2. **Register the route** in `server.ts`'s `sectionHandlers` map:
   ```ts
   "GET /sections/your-thing": () => renderYourThing(),
   ```
3. **Add the placeholder** in `public/index.html`:
   ```html
   <div hx-get="/sections/your-thing" hx-trigger="load" hx-swap="outerHTML"></div>
   ```

That's it. No tsconfig update, no router setup, no component registration.

## What this starter doesn't ship

- **Authentication.** Add it with a `Set-Cookie` from a `/login` POST handler that calls a BIAB customer-portal endpoint, then a middleware that reads the cookie on each section render.
- **Cart + checkout.** Render `<form hx-post="/cart/add">` controls inline with each product; the server calls `biab.cart.add(...)` and returns the updated cart fragment.
- **Pagination on the blog.** Use `hx-get="/sections/blog?page=2" hx-target="closest section" hx-swap="outerHTML"`.

All of these are one or two endpoints + one or two HTMX attributes — that's the point of the framework.

## Why HTMX for BIAB

HTMX is the closest shape to BIAB's own philosophy: the data + the business logic live on the server, the rendered output lives on your domain. Most JS frameworks ship a bundle that re-fetches the same data the server already has. HTMX renders once, swaps fragments on interaction, and never ships a JSON-fetcher. For a service business with mostly static content + a few forms, this is the lightest possible architecture.
