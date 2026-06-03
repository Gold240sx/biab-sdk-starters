import type { APIRoute } from "astro";

import { biab } from "../../../../lib/biab";

export const prerender = false;

/**
 * POST /api/biab/forms/[slug]
 *
 * Forwards a form submission to `biab.forms.submit(slug, data, ...)`.
 * The SDK runs `validateFormSubmission` against the live schema so
 * a missing required field returns a 400 from this route — no DB
 * write happens.
 */
export const POST: APIRoute = async ({ params, request }) => {
	if (!biab) {
		return Response.json(
			{ error: "BIAB not configured. See .env.example." },
			{ status: 503 },
		);
	}
	const slug = params.slug;
	if (!slug) {
		return Response.json({ error: "slug required" }, { status: 400 });
	}
	try {
		const body = (await request.json()) as {
			data: Record<string, unknown>;
			submitterEmail?: string;
			submitterName?: string;
		};
		const result = await biab.forms.submit(slug, body.data, {
			submitterEmail: body.submitterEmail,
			submitterName: body.submitterName,
		});
		return Response.json(result);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Couldn't submit.";
		return Response.json({ error: message }, { status: 400 });
	}
};
