/**
 * Browser-side fetcher for the BIAB SDK proxy (vanilla).
 *
 * Mirrors the shape of `@biab-dev/sdk`'s `createBiabClient` exactly
 * — same method names, same params — so the React-Bun example's
 * components translate one-to-one. The runtime is JS, but JSDoc
 * `@typedef`s give IDEs full IntelliSense without a build step.
 *
 * Every call hits same-origin `/api/biab/*`. The Bun server holds
 * the bearer key.
 *
 * @typedef {Object} GalleryItem
 * @property {string} id
 * @property {"image" | "video"} type
 * @property {string} src
 * @property {number | null} [width]
 * @property {number | null} [height]
 * @property {string | null} [blurDataURL]
 * @property {string | null} [alt]
 * @property {string | null} [title]
 * @property {string | null} [category]
 * @property {string | null} [description]
 * @property {string | null} [jobId]
 * @property {string | null} [jobName]
 * @property {string | null} [takenAt]
 *
 * @typedef {Object} SchedulingEventType
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string | null} description
 * @property {number} durationMinutes
 * @property {string} locationType
 * @property {string | null} meetingProvider
 * @property {string | null} color
 * @property {boolean} requiresApproval
 *
 * @typedef {Object} SchedulingSlot
 * @property {string} startAt
 * @property {string} endAt
 *
 * @typedef {Object} SchedulingInvitee
 * @property {string} email
 * @property {string} name
 * @property {string | null} [phone]
 * @property {string} timezone
 *
 * @typedef {Object} FormFieldDef
 * @property {string} id
 * @property {string} label
 * @property {string} type
 * @property {boolean} required
 * @property {string} [placeholder]
 * @property {string} [helpText]
 *
 * @typedef {Object} FormSchema
 * @property {string} id
 * @property {string} slug
 * @property {string} [title]
 * @property {string | null} [description]
 * @property {FormFieldDef[]} fields
 */

/**
 * @template T
 * @param {string} path
 * @returns {Promise<T>}
 */
async function getJson(path) {
	const res = await fetch(path);
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`${res.status} ${res.statusText} on ${path}: ${text}`);
	}
	return await res.json();
}

/**
 * @template T
 * @param {string} path
 * @param {unknown} body
 * @returns {Promise<T>}
 */
async function postJson(path, body) {
	const res = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`${res.status} ${res.statusText} on ${path}: ${text}`);
	}
	return await res.json();
}

export const biab = {
	marketing: {
		/** @param {{ pageKey?: string; locale?: string }} [params] */
		async getPageBundle(params = {}) {
			const query = new URLSearchParams({
				pageKey: params.pageKey ?? "home",
				locale: params.locale ?? "en",
			});
			return await getJson(`/api/biab/marketing-bundle?${query}`);
		},
	},
	gallery: {
		/**
		 * @param {{ limit?: number; fields?: string[] }} [params]
		 * @returns {Promise<GalleryItem[]>}
		 */
		async list(params = {}) {
			const query = new URLSearchParams();
			if (params.limit) query.set("limit", String(params.limit));
			if (params.fields) query.set("fields", params.fields.join(","));
			const result = await getJson(
				`/api/biab/gallery${query.toString() ? `?${query}` : ""}`,
			);
			return result.items ?? [];
		},
	},
	blog: {
		/** @param {{ limit?: number }} [params] */
		async listPosts(params = {}) {
			const query = new URLSearchParams();
			if (params.limit) query.set("limit", String(params.limit));
			return await getJson(
				`/api/biab/blog/posts${query.toString() ? `?${query}` : ""}`,
			);
		},
	},
	scheduling: {
		/** @returns {Promise<SchedulingEventType[]>} */
		async listEventTypes() {
			const result = await getJson("/api/biab/scheduling/event-types");
			return result.items ?? [];
		},
		/**
		 * @param {string} slug
		 * @param {{ from: Date; to: Date }} params
		 * @returns {Promise<SchedulingSlot[]>}
		 */
		async getAvailableSlots(slug, params) {
			const query = new URLSearchParams({
				slug,
				from: params.from.toISOString(),
				to: params.to.toISOString(),
			});
			const result = await getJson(`/api/biab/scheduling/slots?${query}`);
			return result.slots ?? [];
		},
		/**
		 * @param {{
		 *   eventTypeSlug: string;
		 *   startAt: Date;
		 *   invitee: SchedulingInvitee;
		 *   notes?: string | null;
		 * }} input
		 */
		async confirmBooking(input) {
			return await postJson("/api/biab/scheduling/bookings", {
				...input,
				startAt: input.startAt.toISOString(),
			});
		},
	},
	forms: {
		/**
		 * @param {string} slug
		 * @returns {Promise<FormSchema>}
		 */
		async schema(slug) {
			return await getJson(
				`/api/biab/forms/schema?slug=${encodeURIComponent(slug)}`,
			);
		},
		/**
		 * @param {string} slug
		 * @param {Record<string, unknown>} data
		 * @param {{ submitterEmail?: string; submitterName?: string }} [opts]
		 */
		async submit(slug, data, opts = {}) {
			return await postJson("/api/biab/forms/submit", {
				slug,
				data,
				submitterEmail: opts.submitterEmail,
				submitterName: opts.submitterName,
			});
		},
	},
};

// ---------------------------------------------------------------------------
// DOM helpers — used by every section module.
// ---------------------------------------------------------------------------

/**
 * Render `text` into an element with the given class.
 * @param {string} tag
 * @param {Record<string, string | number | boolean | null | undefined>} attrs
 * @param {(Node | string | null | undefined | false)[]} [children]
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) {
		if (v == null || v === false) continue;
		if (k === "class") node.className = String(v);
		else if (k === "html") node.innerHTML = String(v);
		else if (k.startsWith("on") && typeof v === "function") {
			node.addEventListener(k.slice(2).toLowerCase(), v);
		} else if (k === "dataset" && typeof v === "object") {
			Object.assign(node.dataset, v);
		} else if (v === true) node.setAttribute(k, "");
		else node.setAttribute(k, String(v));
	}
	for (const child of children) {
		if (child == null || child === false) continue;
		node.append(typeof child === "string" ? document.createTextNode(child) : child);
	}
	return node;
}

/** Shorthand for `el("div", {class: "biab-loading"}, ["Loading…"])`. */
export function loading(label = "Loading…") {
	return el("div", { class: "biab-loading" }, [label]);
}

/** Shorthand for the empty state. */
export function empty(message) {
	return el("div", { class: "biab-empty" }, [message]);
}
