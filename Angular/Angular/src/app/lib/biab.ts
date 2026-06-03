import { createBiabClient, type BiabClient } from "@biab-dev/sdk";

/**
 * Shared BIAB client factory. Angular's SSR + hydration model means
 * the same code path runs on the Node server (when prerendering /
 * SSRing) and in the browser (after hydration). We read env via
 * `process.env` on the server and `(import.meta as any).env` on the
 * client — Angular CLI inlines `process.env.NG_APP_*` at build time
 * when you set them in `environment.ts`, but the simplest portable
 * shape is to read both.
 *
 * Returns `null` when env isn't configured so callers can render
 * local fallbacks instead of crashing.
 */

type EnvShape = {
	BIAB_API_KEY?: string;
	BIAB_SITE_ID?: string;
	BIAB_PACKAGE_API_BASE_URL?: string;
};

function readEnv(): EnvShape {
	const fromProcess: EnvShape =
		typeof process !== "undefined" && process.env
			? {
					BIAB_API_KEY: process.env["BIAB_API_KEY"],
					BIAB_SITE_ID: process.env["BIAB_SITE_ID"],
					BIAB_PACKAGE_API_BASE_URL:
						process.env["BIAB_PACKAGE_API_BASE_URL"],
				}
			: {};
	const fromVite: EnvShape =
		typeof import.meta !== "undefined" &&
		(import.meta as unknown as { env?: EnvShape }).env
			? {
					BIAB_API_KEY: (
						import.meta as unknown as { env: EnvShape }
					).env.BIAB_API_KEY,
					BIAB_SITE_ID: (
						import.meta as unknown as { env: EnvShape }
					).env.BIAB_SITE_ID,
					BIAB_PACKAGE_API_BASE_URL: (
						import.meta as unknown as { env: EnvShape }
					).env.BIAB_PACKAGE_API_BASE_URL,
				}
			: {};
	return {
		BIAB_API_KEY: fromProcess.BIAB_API_KEY ?? fromVite.BIAB_API_KEY,
		BIAB_SITE_ID: fromProcess.BIAB_SITE_ID ?? fromVite.BIAB_SITE_ID,
		BIAB_PACKAGE_API_BASE_URL:
			fromProcess.BIAB_PACKAGE_API_BASE_URL ??
			fromVite.BIAB_PACKAGE_API_BASE_URL,
	};
}

function normaliseBaseUrl(input: string): string {
	const next = input.trim().replace(/\/$/, "");
	if (next.endsWith("/api/package/v1")) return next;
	return `${next}/api/package/v1`;
}

let cached: BiabClient | null | undefined;

export function getBiab(): BiabClient | null {
	if (cached !== undefined) return cached;
	const env = readEnv();
	if (!env.BIAB_API_KEY || !env.BIAB_SITE_ID || !env.BIAB_PACKAGE_API_BASE_URL) {
		cached = null;
		return cached;
	}
	cached = createBiabClient({
		apiKey: env.BIAB_API_KEY,
		siteId: env.BIAB_SITE_ID,
		baseUrl: normaliseBaseUrl(env.BIAB_PACKAGE_API_BASE_URL),
	});
	return cached;
}
