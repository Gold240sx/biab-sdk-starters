import { createBiabClient, type BiabClient } from "@biab-dev/sdk";

/**
 * Server-side BIAB client. Astro pages run on the server (we set
 * `output: "server"` in `astro.config.mjs`), so each render reaches
 * straight into the SDK — no separate proxy process needed.
 *
 * Astro pre-fetches env via `import.meta.env`; we also fall back to
 * `process.env` for non-Vite contexts (the API endpoints under
 * `src/pages/api/`).
 *
 * Returns `null` when env isn't configured so callers can render
 * local fallbacks instead of crashing the page.
 */

const apiKey =
	import.meta.env.BIAB_API_KEY ?? process.env.BIAB_API_KEY;
const siteId =
	import.meta.env.BIAB_SITE_ID ?? process.env.BIAB_SITE_ID;
const rawBaseUrl =
	import.meta.env.BIAB_PACKAGE_API_BASE_URL ??
	process.env.BIAB_PACKAGE_API_BASE_URL;

function normalizeBaseUrl(input: string): string {
	const next = input.trim().replace(/\/$/, "");
	if (next.endsWith("/api/package/v1")) return next;
	return `${next}/api/package/v1`;
}

let cached: BiabClient | null | undefined;

export function getBiab(): BiabClient | null {
	if (cached !== undefined) return cached;
	if (!apiKey || !siteId || !rawBaseUrl) {
		cached = null;
		return cached;
	}
	cached = createBiabClient({
		apiKey: apiKey as string,
		siteId: siteId as string,
		baseUrl: normalizeBaseUrl(rawBaseUrl as string),
	});
	return cached;
}

export const biab = getBiab();
