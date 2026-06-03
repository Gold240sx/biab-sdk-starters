import { error, json } from "@sveltejs/kit";

import { biab } from "$lib/server/biab";

import type { RequestHandler } from "./$types";

/**
 * GET /api/biab/scheduling/slots?slug=&from=&to=
 *
 * Wraps `biab.scheduling.getAvailableSlots` so the booking client
 * can compute availability without ever holding the API key.
 */
export const GET: RequestHandler = async ({ url }) => {
	if (!biab) {
		throw error(503, "BIAB not configured. See .env.example.");
	}
	const slug = url.searchParams.get("slug");
	const fromStr = url.searchParams.get("from");
	const toStr = url.searchParams.get("to");
	if (!slug || !fromStr || !toStr) {
		throw error(400, "slug, from, to required");
	}
	try {
		const slots = await biab.scheduling.getAvailableSlots(slug, {
			from: new Date(fromStr),
			to: new Date(toStr),
		});
		return json({ slots });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		throw error(502, message);
	}
};
