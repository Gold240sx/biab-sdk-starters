/**
 * Browser-side fetcher for the BIAB SDK proxy.
 *
 * Every method here calls a same-origin `/api/biab/*` endpoint —
 * the Bun server (see `server.ts`) holds the API key and forwards
 * to BIAB via `@biab-dev/sdk`. The browser bundle never sees the
 * bearer token; this file is safe to ship to clients.
 *
 * Types come from `@biab-dev/sdk` (declarations only — no runtime
 * code from the SDK is bundled here).
 */

import type {
	BlogListPostsResponse,
	BlogPostBySlugResponse,
} from "@biab-dev/sdk/contracts";
import type {
	BundleGalleryItem,
	FormSchema,
	GalleryField,
	GalleryItemFor,
	SchedulingBookingResult,
	SchedulingEventType,
	SchedulingInvitee,
	SchedulingSlot,
} from "@biab-dev/sdk";

async function getJson<T>(path: string): Promise<T> {
	const res = await fetch(path);
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`${res.status} ${res.statusText} on ${path}: ${text}`);
	}
	return (await res.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`${res.status} ${res.statusText} on ${path}: ${text}`);
	}
	return (await res.json()) as T;
}

export const biab = {
	marketing: {
		async getPageBundle(params: { pageKey?: string; locale?: string } = {}) {
			const query = new URLSearchParams({
				pageKey: params.pageKey ?? "home",
				locale: params.locale ?? "en",
			});
			return await getJson<Record<string, unknown>>(
				`/api/biab/marketing-bundle?${query}`,
			);
		},
	},
	gallery: {
		/**
		 * Typed const-generic field selection: `fields: ["src", "title"]
		 * as const` narrows the return type to `Array<Pick<GalleryItem,
		 * "src" | "title">>`. Server-side projection means the DB only
		 * SELECTs the columns you asked for.
		 */
		async list<const F extends readonly GalleryField[]>(params?: {
			limit?: number;
			fields?: F;
		}): Promise<GalleryItemFor<F>[]> {
			const query = new URLSearchParams();
			if (params?.limit) query.set("limit", String(params.limit));
			if (params?.fields) query.set("fields", params.fields.join(","));
			const result = await getJson<{ items: BundleGalleryItem[] }>(
				`/api/biab/gallery${query.toString() ? `?${query}` : ""}`,
			);
			return result.items as never;
		},
	},
	blog: {
		async listPosts(params?: { limit?: number }): Promise<BlogListPostsResponse> {
			const query = new URLSearchParams();
			if (params?.limit) query.set("limit", String(params.limit));
			return await getJson<BlogListPostsResponse>(
				`/api/biab/blog/posts${query.toString() ? `?${query}` : ""}`,
			);
		},
		async getPost(slug: string): Promise<BlogPostBySlugResponse> {
			return await getJson<BlogPostBySlugResponse>(
				`/api/biab/blog/post?slug=${encodeURIComponent(slug)}`,
			);
		},
	},
	scheduling: {
		async listEventTypes(): Promise<SchedulingEventType[]> {
			const result = await getJson<{ items: SchedulingEventType[] }>(
				"/api/biab/scheduling/event-types",
			);
			return result.items;
		},
		async getAvailableSlots(
			slug: string,
			params: { from: Date; to: Date },
		): Promise<SchedulingSlot[]> {
			const query = new URLSearchParams({
				slug,
				from: params.from.toISOString(),
				to: params.to.toISOString(),
			});
			const result = await getJson<{ slots: SchedulingSlot[] }>(
				`/api/biab/scheduling/slots?${query}`,
			);
			return result.slots;
		},
		async confirmBooking(input: {
			eventTypeSlug: string;
			startAt: Date;
			invitee: SchedulingInvitee;
			notes?: string | null;
		}): Promise<SchedulingBookingResult> {
			return await postJson<SchedulingBookingResult>(
				"/api/biab/scheduling/bookings",
				{
					...input,
					startAt: input.startAt.toISOString(),
				},
			);
		},
	},
	forms: {
		async schema(slug: string): Promise<FormSchema> {
			return await getJson<FormSchema>(
				`/api/biab/forms/schema?slug=${encodeURIComponent(slug)}`,
			);
		},
		async submit(
			slug: string,
			data: Record<string, unknown>,
			opts?: { submitterEmail?: string; submitterName?: string },
		): Promise<{ success: true; submissionId?: string }> {
			return await postJson("/api/biab/forms/submit", {
				slug,
				data,
				submitterEmail: opts?.submitterEmail,
				submitterName: opts?.submitterName,
			});
		},
	},
};

export type {
	BundleGalleryItem,
	FormSchema,
	GalleryField,
	SchedulingBookingResult,
	SchedulingEventType,
	SchedulingInvitee,
	SchedulingSlot,
};
