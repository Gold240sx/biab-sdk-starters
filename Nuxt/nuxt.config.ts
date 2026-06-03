// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	css: ["~/assets/css/biab-tokens.css"],
	/**
	 * Server-only env. Nitro reads these from `NUXT_*`-prefixed
	 * process.env at runtime (e.g. `NUXT_BIAB_API_KEY`). They're
	 * never bundled into the client because they live under the
	 * non-public `runtimeConfig` namespace.
	 */
	runtimeConfig: {
		biabApiKey: "",
		biabSiteId: "",
		biabPackageApiBaseUrl: "",
		biabRevalidationSecret: "",
	},
});
