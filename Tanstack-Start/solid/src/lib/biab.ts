/**
 * Server-only BIAB client. Only imported from `createServerFn`
 * handlers in `biab-server-fns.ts`, so the bearer key never reaches
 * the browser bundle.
 *
 * Returns `null` when env isn't configured so callers can fall
 * back to local defaults instead of crashing the page.
 */

import { createBiabClient, type BiabClient } from "@biab-dev/sdk";

function normalizeBaseUrl(input: string): string {
	const next = input.trim().replace(/\/$/, "");
	if (next.endsWith("/api/package/v1")) return next;
	return `${next}/api/package/v1`;
}

let cached: BiabClient | null | undefined;

export function getBiab(): BiabClient | null {
	if (cached !== undefined) return cached;
	const apiKey = process.env.BIAB_API_KEY;
	const siteId = process.env.BIAB_SITE_ID;
	const baseUrl = process.env.BIAB_PACKAGE_API_BASE_URL;
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
