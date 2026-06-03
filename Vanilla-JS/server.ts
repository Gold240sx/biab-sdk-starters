/**
 * Bun HTTP server — serves the vanilla `./public/` directory and
 * proxies `/api/biab/*` to BIAB via `@biab-dev/sdk`.
 *
 * No Vite, no bundler. The browser loads `index.html`, `index.html`
 * imports ES modules from `/sections/*.js`, those modules import
 * the typed fetcher in `/biab.js`. Every API call is same-origin
 * — this server is the key-holder.
 *
 * Run: `bun run dev` (auto-reload) or `bun run start` (prod).
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

function errMessage(err: unknown): string {
	return err instanceof Error ? err.message : "Unknown error";
}

/**
 * Same route table shape as the React-Bun starter — when adding a
 * surface, one entry here + one method in `public/biab.js`.
 */
const routes: Record<string, (req: Request) => Promise<Response>> = {
	"GET /api/biab/marketing-bundle": async (req) => {
		if (!biab) return notConfigured();
		const url = new URL(req.url);
		try {
			const bundle = await biab.marketing.getPageBundle({
				pageKey: url.searchParams.get("pageKey") ?? "home",
				locale: url.searchParams.get("locale") ?? "en",
			});
			return jsonResponse(bundle);
		} catch (err) {
			return jsonResponse({ error: errMessage(err) }, 502);
		}
	},

	"GET /api/biab/gallery": async (req) => {
		if (!biab) return notConfigured();
		const url = new URL(req.url);
		const limit = Number(url.searchParams.get("limit") ?? "12");
		const fieldsParam = url.searchParams.get("fields");
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

	"GET /api/biab/blog/posts": async (req) => {
		if (!biab) return notConfigured();
		const url = new URL(req.url);
		try {
			const result = await biab.blog.listPosts({
				limit: Number(url.searchParams.get("limit") ?? "6"),
			});
			return jsonResponse(result);
		} catch (err) {
			return jsonResponse({ error: errMessage(err) }, 502);
		}
	},

	"GET /api/biab/scheduling/event-types": async () => {
		if (!biab) return notConfigured();
		try {
			const items = await biab.scheduling.listEventTypes();
			return jsonResponse({ items });
		} catch (err) {
			return jsonResponse({ error: errMessage(err) }, 502);
		}
	},

	"GET /api/biab/scheduling/slots": async (req) => {
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

	"POST /api/biab/scheduling/bookings": async (req) => {
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

	"GET /api/biab/forms/schema": async (req) => {
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

	"POST /api/biab/forms/submit": async (req) => {
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
};

const CONTENT_TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".json": "application/json",
};

async function serveStatic(pathname: string): Promise<Response | null> {
	const path = pathname === "/" ? "/index.html" : pathname;
	const file = Bun.file(`./public${path}`);
	if (!(await file.exists())) return null;
	const ext = path.slice(path.lastIndexOf("."));
	const type = CONTENT_TYPES[ext] ?? "application/octet-stream";
	return new Response(file, { headers: { "Content-Type": type } });
}

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const route = routes[`${req.method} ${url.pathname}`];
		if (route) return route(req);
		if (req.method === "GET") {
			const file = await serveStatic(url.pathname);
			if (file) return file;
			// SPA fallback — `/blog/foo` shows the SPA shell; client-side
			// routing (or just the home page) handles it.
			const fallback = await serveStatic("/index.html");
			if (fallback) return fallback;
		}
		return jsonResponse({ error: "Not found" }, 404);
	},
});

console.log(`[biab-vanilla] http://localhost:${server.port}`);
