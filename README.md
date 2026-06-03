# biab-sdk-starters

Working starter projects for [`@biab-dev/sdk`](https://www.npmjs.com/package/@biab-dev/sdk) — the developer SDK for [Business In A Box](https://www.biab.app). One starter per framework. Each one boots into a contractor-shaped landing page that pulls its copy from a BIAB host through the package API.

## Why this repo exists

`@biab-dev/sdk` is framework-agnostic — it's just a typed HTTP client. But every framework has its own convention for *where the bearer key lives*, *how server routes are declared*, and *how data flows into a component*. This repo ships one minimal but production-shaped project per framework so you can:

- **Start fresh** — `git clone` the starter you want and rename it.
- **Add to an existing codebase** — copy the `lib/biab*` files and a representative section component into your project. Each starter keeps the BIAB-specific code small enough to lift wholesale.

## Starters

| Framework | Path | Server style | Notes |
|---|---|---|---|
| **Next.js (T3)** | [`T3-App/`](./T3-App) | App Router + RSC | tRPC wrapping the SDK. |
| **Astro** | [`Astro/`](./Astro) | `output: "server"` | Standard server endpoints. |
| **Nuxt 3** | [`Nuxt/`](./Nuxt) | Nitro `server/api/*` | `useFetch` consumers. |
| **Remix** | [`Remix/`](./Remix) | Resource routes | `loader` + `action`. |
| **SvelteKit** | [`Svelte/`](./Svelte) | `+page.server.ts` | Includes Storybook + Playwright wiring. |
| **TanStack Start** | [`Tanstack-Start/`](./Tanstack-Start) | `createServerFn` / `createAPIFileRoute` | Solid + React variants. |
| **Qwik** | [`Qwik/`](./Qwik) | Route loaders | |
| **Angular 18+** | [`Angular/`](./Angular) | Express SSR | Signals-based `BiabService`. |
| **React (Vite)** | [`React-Bun/`](./React-Bun) | Bun companion server | Browser SPA + same-origin proxy. |
| **HTMX** | [`HTMX/`](./HTMX) | Bun HTTP server | Server-rendered HTML fragments, `hx-get` triggers. |
| **Vanilla JS** | [`Vanilla-JS/`](./Vanilla-JS) | Bun HTTP server | No bundler. ES modules + `/api/biab/*` proxy. |

## How to use

```bash
git clone https://github.com/Gold240sx/biab-sdk-starters.git
cd biab-sdk-starters/<framework>/
cp .env.example .env.local   # fill in BIAB_API_KEY, BIAB_SITE_ID, BIAB_PACKAGE_API_BASE_URL
pnpm install                  # or npm / bun / yarn — each starter declares its preferred manager
pnpm dev
```

Get the three env values from **Site Builder → Developer → Package API & Unkey keys** inside the BIAB dashboard. See the [Getting Started](https://biab-dev-docs.vercel.app/docs/getting-started) doc for the full walkthrough.

## Schema as code via MCP

Each starter ships ready to read data. To **define a schema and seed data programmatically** — instead of clicking through the dashboard — every BIAB tenant exposes two surfaces:

1. **MCP endpoint** at `https://<tenant-host>/api/mcp` — JSON-RPC 2.0 tools an AI client (Claude desktop, Cursor, ChatGPT, Goose, VSCode) can call to read the catalog or capture quote requests. Discovery manifest at `/.well-known/mcp.json`.
2. **Package API** at `https://<tenant-host>/api/package/v1` — bearer-key client (`@biab-dev/sdk`) that creates collections, upserts rows, and reads them back.

The MCP surface today covers visitor-facing agent tools (catalog reads, quote capture). **Schema definition + bulk-seed live on the SDK side.** From any starter:

```ts
const site = biab.site(process.env.BIAB_SITE_ID!);

// 1. Define schema
await site.collections.create({
  name: "Launch Inventory",
  slug: "launch-inventory",
  fields: [
    { name: "sku", type: "string", required: true, queryable: true },
    { name: "title", type: "string", required: true, searchable: true },
    { name: "priceCents", type: "number", required: true },
    { name: "available", type: "boolean", required: true, queryable: true },
  ],
});

// 2. Seed rows (loop or bounded concurrency)
for (const data of seedRows) {
  await site.rows.upsert("launch-inventory", { data });
}
```

Full walkthrough — MCP handshake, all 11 framework patterns, error handling, and the roadmap for `define_collection` / `seed_rows` MCP tools — at [MCP, Schema, and Seeding](https://biab-dev-docs.vercel.app/docs/mcp-schema-and-seeding).

## Docs

- [SDK overview & getting started](https://biab-dev-docs.vercel.app/docs/getting-started)
- [Authentication & scopes](https://biab-dev-docs.vercel.app/docs/authentication-and-scopes)
- [Collections & rows](https://biab-dev-docs.vercel.app/docs/collections-and-rows)
- [MCP, schema, and seeding](https://biab-dev-docs.vercel.app/docs/mcp-schema-and-seeding)
- [Customer portal](https://biab-dev-docs.vercel.app/docs/customer-portal)
- [All framework starters reference](https://biab-dev-docs.vercel.app/docs/starter-templates)

## SDK package

- npm: <https://www.npmjs.com/package/@biab-dev/sdk>

```bash
npm install @biab-dev/sdk
# or
pnpm add @biab-dev/sdk
```

## Picking a starter

Pick the row that matches your stack. The body of each starter's section files (`hero`, `services`, `blog`, `contact-form`) is intentionally similar across frameworks so you can compare patterns side-by-side. The difference is *where the SDK lives* and *how the value reaches the view layer* — those are the framework-shaped decisions.

If you're new to BIAB, start with the **Next.js (T3)** starter — it has the most thorough internal docs and is the canonical reference for the Customer Portal + Marketing Pages walkthroughs in the docs site.

## Contributing

These templates track the live SDK. When `@biab-dev/sdk` ships a major breaking change, each starter gets a matching bump here. PRs that bring a starter to feature-parity with another (e.g. adding the chatbot embed to a starter missing it) are welcome.

## License

MIT.
