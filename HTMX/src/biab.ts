import { createBiabClient, type BiabClient } from "@biab-dev/sdk";

/**
 * Server-side BIAB client. HTMX renders are entirely server-side
 * — the browser only receives HTML, never the SDK or the bearer
 * key. One client instance is reused across requests.
 *
 * Returns `null` when env isn't configured so section endpoints
 * can render local fallbacks (no crash, no blank page).
 */

const apiKey = process.env["BIAB_API_KEY"];
const siteId = process.env["BIAB_SITE_ID"];
const rawBaseUrl = process.env["BIAB_PACKAGE_API_BASE_URL"];

function normaliseBaseUrl(input: string): string {
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
		apiKey,
		siteId,
		baseUrl: normaliseBaseUrl(rawBaseUrl),
	});
	return cached;
}

export const ANALYTICS_PUBLIC = {
	siteId: siteId ?? null,
	baseUrl: rawBaseUrl ? normaliseBaseUrl(rawBaseUrl) : null,
	apiKey: apiKey ?? null,
};
