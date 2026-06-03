import { createServerFileRoute } from "@tanstack/solid-start/server";

import { createGenericRevalidateHandler } from "@biab-dev/sdk/adapters/revalidate";

/**
 * BIAB → TanStack Start revalidation webhook receiver.
 *
 * Register this URL in BIAB at /dashboard/settings/integrations
 * and paste the revealed `whsec_…` into BIAB_REVALIDATION_SECRET.
 * The SDK adapter verifies the HMAC + replay window; the callback
 * is where you wire any response-level cache purge (CDN tag, KV
 * delete, etc.).
 */
const secret = process.env.BIAB_REVALIDATION_SECRET;

const handler = secret
	? createGenericRevalidateHandler({
			secret,
			onTagsRevalidated: async (tags, orgId) => {
				console.info(
					`[biab] revalidate received tags=${tags.join(",")} org=${orgId}`,
				);
			},
		})
	: null;

export const ServerRoute = createServerFileRoute("/api/biab/revalidate").methods({
	POST: async ({ request }) => {
		if (!handler) {
			return new Response(
				JSON.stringify({
					ok: false,
					reason: "BIAB_REVALIDATION_SECRET not configured",
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}
		return await handler(request);
	},
});
