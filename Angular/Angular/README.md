# BIAB SDK — Angular starter

Same generic business site as the React-Bun, Astro, and Vanilla-JS starters, built on **Angular 18+ standalone components** with SSR + client hydration.

## Why this shape

Angular's `provideClientHydration()` gives you the best of both worlds: the server pre-renders every section with the BIAB SDK's data (no flash, no spinner, full SEO), then hydrates on the client so the contact form and analytics stay interactive.

```
browser → page request → Angular SSR → BiabService.load*() → BIAB Package API
                                     ↑
                                     └ @biab-dev/sdk + bearer key on the server
```

Five sections render with the BIAB data on first paint:

- **Hero / About / Services** read the marketing bundle (and product catalog for services) and fall back to local defaults
- **Blog** lists posts via `biab.blog.listPosts(...)`
- **Header / Footer** are pure static

One section is browser-interactive:

- **ContactForm** — Reactive form posts to `biab.forms.submit({ slug: "contact", ... })`

Analytics boots via `provideAppInitializer(...)` and only fires in the browser — server render skips it.

## Setup

```sh
npm install     # or pnpm install / bun install
cp .env.example .env.local
# Fill BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL

npm run dev
```

Open <http://localhost:4200> (Angular's default dev port). Each section either:

- Renders inline with the SDK data on first paint (no flash, no spinner), or
- Renders an empty-state with a hint to author the content in BIAB.

For production:

```sh
npm run build
node dist/Angular/server/server.mjs
```

(File names depend on what you set in `angular.json` for the project name — check the build output.)

## The shape, file-by-file

```
src/
├── main.ts                    # bootstrapApplication(App, appConfig)
├── main.server.ts             # SSR bootstrap
├── server.ts                  # Express handler for SSR rendering
├── index.html                 # the shell — body just has <app-root />
├── styles.scss                # global CSS reset (unused; per-component scoped)
└── app/
    ├── app.ts                 # root component, composes the sections
    ├── app.html               # <biab-header /> <main>...sections...</main> <biab-footer />
    ├── app.scss               # shared section/card/btn styles
    ├── app.config.ts          # provideRouter + provideClientHydration + analytics initialiser
    ├── app.routes.ts          # routes (empty by default; home is the App component)
    ├── lib/
    │   ├── biab.ts            # BIAB SDK client factory (server + client)
    │   └── biab.service.ts    # injectable service with `hero / about / services / blog` signals
    └── sections/
        ├── header.component.ts
        ├── hero.component.ts
        ├── about.component.ts
        ├── services.component.ts
        ├── blog.component.ts
        ├── contact-form.component.ts
        └── footer.component.ts
```

## How a section fetches data

```ts
@Component({
  selector: "biab-hero",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <h1>{{ svc.hero().title }}</h1>
      <p>{{ svc.hero().tagline }}</p>
    </section>
  `,
})
export class HeroComponent implements OnInit {
  readonly svc = inject(BiabService);
  ngOnInit() { void this.svc.loadHero(); }
}
```

The service holds a signal with the local defaults. `loadHero()` either succeeds (SDK call returns a marketing bundle) and overwrites the signal, or quietly keeps the defaults (SDK not configured, network error, etc.). Either way the section renders something.

## Why the SDK calls live in a service

Sharing one `BiabService` across components dedupes the marketing-bundle fetch (Hero + About + Services all read the same bundle — one call hydrates all three signals on the next iteration). If you want per-section eager prefetching, you can call `loadAll()` in a route resolver instead.

## Analytics

`provideAppInitializer(initAnalytics)` runs once during bootstrap. It checks `isPlatformBrowser(PLATFORM_ID)` to skip during SSR, then dynamically imports `@biab-dev/sdk/analytics-core` and calls `initBiabAnalytics({ siteId, baseUrl, apiKey })`. Cookies are not used; DNT and GPC are honoured.

If env isn't configured, analytics silently doesn't load — the page still works.

## Patterns to extend

Adding a new section is three files:

1. Add a `loadX()` method + signal to `BiabService` calling the relevant SDK method.
2. Add a component file in `src/app/sections/` with `inject(BiabService)` and `ngOnInit` calling `loadX()`.
3. Import it into `App` and drop the selector into `app.html`.

For interactivity (cart, account, anything stateful), use a Reactive form + `signal`-based component state.

## What this starter doesn't ship

- **Authentication.** Add it via Angular's HTTP interceptor calling your BIAB customer-portal endpoints. See the React-Bun starter for an example of the same pattern in React.
- **Cart + checkout.** The SDK exposes them; the starter just doesn't render them. Add a CartComponent that reads `biab.cart.get()` and a CheckoutComponent that calls `biab.cart.checkout(...)`.
- **A polished design.** The styles in `app.scss` are intentionally vanilla — the goal of this starter is the data + composition shape, not the visual layer.

## Build target / Angular version

Generated by Angular CLI v21+ targeting Angular 18+. SSR mode is on by default (see `server.ts` and `app.config.server.ts`).
