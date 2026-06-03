/**
 * Bun HTTP server — the **API-key holder** for this React SPA.
 *
 * Pure SPAs can't talk to BIAB directly because there's no safe way
 * to hide an API key from the browser bundle. This Bun process does
 * two jobs:
 *
 *   1. Hold `BIAB_API_KEY` server-side and proxy a small, typed set
 *      of `/api/biab/*` endpoints to BIAB via `@biab-dev/sdk`.
 *   2. Serve the Vite-built `dist/` directory in production. In dev,
 *      Vite (on :5173) forwards `/api/biab/*` here via its proxy
 *      config — see `vite.config.ts`.
 *
 * Browser → /api/biab/<route> → Bun (this file) → BIAB Package API.
 * The browser never sees the bearer key.
 *
 * Run modes:
 *   - dev:    `bun run dev:server`  (alongside `bun run dev:vite`)
 *   - prod:   `bun run preview`      (after `bun run build`)
 *   - both:   `bun run dev`          (concurrently)
 */

import { createBiabClient } from "@biab-dev/sdk";

const PORT = Number(process.env.PORT ?? 3000);

const apiKey = process.env.BIAB_API_KEY;
const siteId = process.env.BIAB_SITE_ID;
const baseUrl = process.env.BIAB_PACKAGE_API_BASE_URL;

if (!apiKey || !siteId || !baseUrl) {
	console.warn(
		"\n[biab] Missing one of BIAB_API_KEY / BIAB_SITE_ID / BIAB_PACKAGE_API_BASE_URL.",
		"\n[biab] Set them in .env.local (see .env.example) — until then /api/biab/* returns 503.\n",
	);
}

const biab =
	apiKey && siteId && baseUrl
		? createBiabClient({
				apiKey,
				siteId,
				baseUrl: baseUrl.replace(/\/$/, "").endsWith("/api/package/v1")
					? baseUrl
					: `${baseUrl.replace(/\/$/, "")}/api/package/v1`,
			})
		: null;

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function notConfigured(): Response {
	return jsonResponse(
		{ error: "BIAB not configured on this server. See .env.example." },
		503,
	);
}

/**
 * Each handler wraps one SDK call. Keep handlers small + composable
 * so adding a new surface is one entry in the route table below.
 */
const routes: Record<
	string,
	{ method: "GET" | "POST"; handler: (req: Request) => Promise<Response> }
> = {
	"GET /api/biab/marketing-bundle": {
		method: "GET",
		handler: async (req) => {
			if (!biab) return notConfigured();
			const url = new URL(req.url);
			const pageKey = url.searchParams.get("pageKey") ?? "home";
			const locale = url.searchParams.get("locale") ?? "en";
			try {
				const bundle = await biab.marketing.getPageBundle({ pageKey, locale });
				return jsonResponse(bundle);
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 502);
			}
		},
	},

	"GET /api/biab/gallery": {
		method: "GET",
		handler: async (req) => {
			if (!biab) return notConfigured();
			const url = new URL(req.url);
			const limit = Number(url.searchParams.get("limit") ?? "12");
			const fieldsParam = url.searchParams.get("fields");
			// Field selection is the SDK's typed feature: server-side
			// projection so we don't pay for columns this page won't render.
			try {
				const items = fieldsParam
					? await biab.gallery.list({
							limit,
							fields: fieldsParam.split(",") as unknown as readonly [],
						})
					: await biab.gallery.list({ limit });
				return jsonResponse({ items });
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 502);
			}
		},
	},

	"GET /api/biab/blog/posts": {
		method: "GET",
		handler: async (req) => {
			if (!biab) return notConfigured();
			const url = new URL(req.url);
			const limit = Number(url.searchParams.get("limit") ?? "6");
			try {
				const result = await biab.blog.listPosts({ limit });
				return jsonResponse(result);
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 502);
			}
		},
	},

	"GET /api/biab/scheduling/event-types": {
		method: "GET",
		handler: async () => {
			if (!biab) return notConfigured();
			try {
				const items = await biab.scheduling.listEventTypes();
				return jsonResponse({ items });
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 502);
			}
		},
	},

	"GET /api/biab/scheduling/slots": {
		method: "GET",
		handler: async (req) => {
			if (!biab) return notConfigured();
			const url = new URL(req.url);
			const slug = url.searchParams.get("slug");
			const fromStr = url.searchParams.get("from");
			const toStr = url.searchParams.get("to");
			if (!slug || !fromStr || !toStr) {
				return jsonResponse({ error: "slug, from, to required" }, 400);
			}
			try {
				const slots = await biab.scheduling.getAvailableSlots(slug, {
					from: new Date(fromStr),
					to: new Date(toStr),
				});
				return jsonResponse({ slots });
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 502);
			}
		},
	},

	"POST /api/biab/scheduling/bookings": {
		method: "POST",
		handler: async (req) => {
			if (!biab) return notConfigured();
			try {
				const body = (await req.json()) as {
					eventTypeSlug: string;
					startAt: string;
					invitee: {
						email: string;
						name: string;
						phone?: string | null;
						timezone: string;
					};
					notes?: string | null;
				};
				const result = await biab.scheduling.confirmBooking({
					eventTypeSlug: body.eventTypeSlug,
					startAt: new Date(body.startAt),
					invitee: body.invitee,
					notes: body.notes ?? null,
				});
				return jsonResponse(result);
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 400);
			}
		},
	},

	"GET /api/biab/forms/schema": {
		method: "GET",
		handler: async (req) => {
			if (!biab) return notConfigured();
			const slug = new URL(req.url).searchParams.get("slug");
			if (!slug) return jsonResponse({ error: "slug required" }, 400);
			try {
				const schema = await biab.forms.schema(slug);
				return jsonResponse(schema);
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 502);
			}
		},
	},

	"POST /api/biab/forms/submit": {
		method: "POST",
		handler: async (req) => {
			if (!biab) return notConfigured();
			try {
				const body = (await req.json()) as {
					slug: string;
					data: Record<string, unknown>;
					submitterEmail?: string;
					submitterName?: string;
				};
				const result = await biab.forms.submit(body.slug, body.data, {
					submitterEmail: body.submitterEmail,
					submitterName: body.submitterName,
				});
				return jsonResponse(result);
			} catch (err) {
				return jsonResponse({ error: errMessage(err) }, 400);
			}
		},
	},
};

function errMessage(err: unknown): string {
	return err instanceof Error ? err.message : "Unknown error";
}

const isProd = process.env.NODE_ENV === "production";

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const key = `${req.method} ${url.pathname}`;
		const route = routes[key];
		if (route) return route.handler(req);

		// Production: serve the Vite build's dist/. In dev Vite handles the
		// SPA on :5173 and forwards /api/biab/* here (see vite.config.ts), so
		// we only return 404 for non-API paths.
		if (isProd && req.method === "GET") {
			const path = url.pathname === "/" ? "/index.html" : url.pathname;
			const file = Bun.file(`./dist${path}`);
			if (await file.exists()) {
				return new Response(file);
			}
			// SPA fallback — let client-side routing handle unknown paths.
			return new Response(Bun.file("./dist/index.html"));
		}
		return jsonResponse({ error: "Not found" }, 404);
	},
});

console.log(`[biab-proxy] Listening on http://localhost:${server.port}`);
if (!isProd) {
	console.log("[biab-proxy] Run `bun run dev:vite` for the SPA on :5173.");
}
