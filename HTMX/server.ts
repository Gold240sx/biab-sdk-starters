/**
 * HTMX starter — Bun HTTP server that returns HTML fragments
 * per section. The browser loads `public/index.html`, HTMX fires
 * `hx-get` requests against `/sections/*` on body load, each
 * endpoint renders its fragment using the BIAB SDK (server-side)
 * and returns the HTML string.
 *
 * Same configuration shape as the Vanilla-JS starter (env keys,
 * dev-mode warnings) — the difference is that this server returns
 * HTML, not JSON, and the SDK lives in `src/sections/*` rather
 * than `public/sections/*.js`.
 */

import { ANALYTICS_PUBLIC } from "./src/biab";
import { renderAbout } from "./src/sections/about";
import { renderBlog } from "./src/sections/blog";
import {
	handleContactSubmit,
	renderContactForm,
} from "./src/sections/contact-form";
import { renderFooter, renderHeader } from "./src/sections/header";
import { renderHero } from "./src/sections/hero";
import { renderServices } from "./src/sections/services";

const PORT = Number(process.env["PORT"] ?? 3000);

if (!ANALYTICS_PUBLIC.siteId) {
	console.warn(
		"\n[biab] Missing one of BIAB_API_KEY / BIAB_SITE_ID / BIAB_PACKAGE_API_BASE_URL.",
		"\n[biab] Set them in .env.local — sections will render local fallbacks until then.\n",
	);
}

function htmlResponse(body: string, status = 200): Response {
	return new Response(body, {
		status,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

/**
 * Section handlers — one entry per HTMX endpoint. Keep this map
 * small and explicit: each line is a URL the index.html knows
 * about, and a function the section module exports.
 */
type Handler = (req: Request) => Promise<string> | string;

const sectionHandlers: Record<string, Handler> = {
	"GET /sections/header": () => renderHeader(),
	"GET /sections/hero": () => renderHero(),
	"GET /sections/about": () => renderAbout(),
	"GET /sections/services": () => renderServices(),
	"GET /sections/blog": () => renderBlog(),
	"GET /sections/contact": () => renderContactForm(),
	"GET /sections/footer": () => renderFooter(),
	"POST /sections/contact": async (req) =>
		handleContactSubmit(await req.formData()),
};

/**
 * Inject a tiny <script> at the end of the shell HTML that fires
 * BIAB analytics. We do this server-side so the public config is
 * known at render time + the browser bundle stays empty of any
 * env-reading code.
 */
function injectAnalyticsConfig(shell: string): string {
	if (!ANALYTICS_PUBLIC.siteId || !ANALYTICS_PUBLIC.baseUrl || !ANALYTICS_PUBLIC.apiKey) {
		return shell;
	}
	const config = JSON.stringify({
		siteId: ANALYTICS_PUBLIC.siteId,
		baseUrl: ANALYTICS_PUBLIC.baseUrl,
		apiKey: ANALYTICS_PUBLIC.apiKey,
	});
	return shell.replace(
		"</body>",
		`<script>window.__BIAB_ANALYTICS__=${config};</script></body>`,
	);
}

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const key = `${req.method} ${url.pathname}`;

		const handler = sectionHandlers[key];
		if (handler) {
			try {
				return htmlResponse(await handler(req));
			} catch (err) {
				console.error(`[biab] ${key} failed:`, err);
				return htmlResponse(
					`<p class="error">Couldn't load this section.</p>`,
					500,
				);
			}
		}

		// Serve static files from ./public/. index.html is served
		// for "/" and gets the analytics config injected before
		// the closing body tag.
		const path = url.pathname === "/" ? "/index.html" : url.pathname;
		const file = Bun.file(`./public${path}`);
		if (await file.exists()) {
			if (path.endsWith(".html")) {
				const text = await file.text();
				return htmlResponse(injectAnalyticsConfig(text));
			}
			return new Response(file);
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`[biab] HTMX starter listening on http://localhost:${server.port}`);
