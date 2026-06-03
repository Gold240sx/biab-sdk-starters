import {
	ApplicationConfig,
	PLATFORM_ID,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	inject,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { isPlatformBrowser } from "@angular/common";
import {
	provideClientHydration,
	withEventReplay,
} from "@angular/platform-browser";

import { routes } from "./app.routes";

/**
 * Browser-only initialiser that boots BIAB analytics once the
 * client takes over. Server render skips it — `initBiabAnalytics`
 * has no side effects on the server but importing the module
 * conditionally keeps the SSR bundle smaller.
 *
 * Reads the same env keys as the data-fetch SDK helper
 * (`src/app/lib/biab.ts`). When env isn't configured (local dev
 * without `.env.local`), analytics quietly stays off.
 */
function initAnalytics(): void {
	const platformId = inject(PLATFORM_ID);
	if (!isPlatformBrowser(platformId)) return;
	const env = (import.meta as unknown as {
		env?: Record<string, string | undefined>;
	}).env;
	const siteId = env?.["BIAB_SITE_ID"];
	const baseUrl = env?.["BIAB_PACKAGE_API_BASE_URL"];
	const apiKey = env?.["BIAB_API_KEY"];
	if (!siteId || !baseUrl || !apiKey) return;
	void import("@biab-dev/sdk/analytics-core").then(({ initBiabAnalytics }) => {
		initBiabAnalytics({ siteId, baseUrl, apiKey });
	});
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		provideClientHydration(withEventReplay()),
		provideAppInitializer(initAnalytics),
	],
};
