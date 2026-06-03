import { createBiabClient, type BiabClient } from "@biab-dev/sdk";

/**
 * Server-side BIAB client. Remix `loader` + `action` functions run on
 * the server, so the SDK + the bearer key live here. The browser
 * never sees them.
 *
 * Returns `null` when env isn't configured so loaders can render
 * local fallbacks instead of throwing.
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

/**
 * Loader-side env passthrough so the client can boot BIAB analytics
 * without baking the public key into the build. Returns only the
 * public-safe values — never the bearer key (the bearer key never
 * leaves this server module).
 *
 * The analytics-core init treats `apiKey` as the public-read key,
 * which is the same as the SDK bearer key for BIAB. If you want a
 * separate analytics-only key, mint one in BIAB dashboard → API
 * keys and set it as `BIAB_PUBLIC_KEY` here.
 */
export function getAnalyticsConfig(): {
	siteId: string;
	baseUrl: string;
	apiKey: string;
} | null {
	if (!siteId || !rawBaseUrl) return null;
	const publicKey = process.env["BIAB_PUBLIC_KEY"] ?? apiKey;
	if (!publicKey) return null;
	return {
		siteId,
		baseUrl: normaliseBaseUrl(rawBaseUrl),
		apiKey: publicKey,
	};
}
