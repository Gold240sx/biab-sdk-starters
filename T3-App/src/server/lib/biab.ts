import "server-only";

import { createBiabClient, type BiabClient } from "@biab-dev/sdk";

import { env } from "@/env";

/**
 * Server-only BIAB client. The `server-only` import at the top of
 * this file makes Next throw a build error if any client component
 * imports it — the bearer key is guaranteed to never reach the
 * browser bundle.
 *
 * Returns `null` when env isn't configured so callers can render
 * local fallbacks instead of crashing the page.
 */

function normalizeBaseUrl(input: string): string {
	const next = input.trim().replace(/\/$/, "");
	if (next.endsWith("/api/package/v1")) return next;
	return `${next}/api/package/v1`;
}

let cached: BiabClient | null | undefined;

export function getBiab(): BiabClient | null {
	if (cached !== undefined) return cached;
	const apiKey = env.BIAB_API_KEY;
	const siteId = env.BIAB_SITE_ID;
	const baseUrl = env.BIAB_PACKAGE_API_BASE_URL;
	if (!apiKey || !siteId || !baseUrl) {
		cached = null;
		return cached;
	}
	cached = createBiabClient({
		apiKey,
		siteId,
		baseUrl: normalizeBaseUrl(baseUrl),
	});
	return cached;
}
