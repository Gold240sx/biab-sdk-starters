import { biab, el } from "../biab.js";

/**
 * Forms surface end-to-end:
 *   1. Fetch the schema (cached on BIAB side).
 *   2. Render each field based on its `type`.
 *   3. Submit — the SDK's `validateFormSubmission` runs server-side
 *      before the row hits the DB so a bad payload returns a 400.
 *
 * Replace `FORM_SLUG` with the form you authored in BIAB → Forms.
 *
 * @param {HTMLElement} target
 */
const FORM_SLUG = "contact";

const FALLBACK_SCHEMA = {
	id: "fallback",
	slug: FORM_SLUG,
	title: "Get in touch",
	description: "We'll get back within one business day.",
	fields: [
		{ id: "name", label: "Name", type: "text", required: true },
		{ id: "email", label: "Email", type: "email", required: true },
		{ id: "message", label: "Message", type: "textarea", required: true },
	],
};

export async function renderContactForm(target) {
	let schema = FALLBACK_SCHEMA;
	const data = {};
	let confirmation = null;
	let error = null;
	let submitting = false;

	try {
		schema = await biab.forms.schema(FORM_SLUG);
	} catch {
		// stay on FALLBACK_SCHEMA — keeps the page useful before the
		// org has authored a real form in BIAB.
	}

	function renderField(field) {
		const id = `field-${field.id}`;
		const label = el("label", { class: "biab-label", for: id }, [
			`${field.label}${field.required ? " *" : ""}`,
		]);
		const inputNode =
			field.type === "textarea"
				? el("textarea", {
						class: "biab-textarea",
						id,
						placeholder: field.placeholder ?? "",
						required: field.required,
						value: data[field.id] ?? "",
						onInput: (e) => {
							data[field.id] = e.currentTarget.value;
						},
					})
				: el("input", {
						class: "biab-input",
						id,
						type: field.type === "email" ? "email" : "text",
						placeholder: field.placeholder ?? "",
						required: field.required,
						value: data[field.id] ?? "",
						onInput: (e) => {
							data[field.id] = e.currentTarget.value;
						},
					});
		const children = [label, inputNode];
		if (field.helpText) {
			children.push(
				el("small", { style: "color: var(--text-muted);" }, [field.helpText]),
			);
		}
		return el("div", {}, children);
	}

	async function handleSubmit(ev) {
		ev.preventDefault();
		submitting = true;
		error = null;
		rerender();
		try {
			await biab.forms.submit(FORM_SLUG, data, {
				submitterEmail: data.email,
				submitterName: data.name,
			});
			confirmation = "Thanks — we'll be in touch within one business day.";
			for (const k of Object.keys(data)) delete data[k];
		} catch (err) {
			error = err instanceof Error ? err.message : "Couldn't submit.";
		} finally {
			submitting = false;
			rerender();
		}
	}

	function rerender() {
		if (confirmation) {
			target.replaceChildren(
				el("div", { class: "biab-card contact" }, [
					el("span", { class: "biab-badge", style: "align-self: flex-start;" }, [
						"Received",
					]),
					el("h2", { class: "biab-section__title" }, ["Got it."]),
					el("p", {}, [confirmation]),
				]),
			);
			return;
		}

		const lead = el("div", { class: "biab-section__lead" }, [
			el("span", { class: "biab-section__eyebrow" }, ["Contact"]),
			el("h2", { class: "biab-section__title" }, [schema.title ?? "Get in touch"]),
			schema.description
				? el("p", { class: "biab-section__sub" }, [schema.description])
				: null,
		]);

		const form = el(
			"form",
			{ class: "biab-card contact", onSubmit: handleSubmit },
			[
				...schema.fields.map(renderField),
				el(
					"button",
					{
						class: "biab-btn",
						type: "submit",
						style: "align-self: flex-start;",
						disabled: submitting,
					},
					[submitting ? "Sending…" : "Send message"],
				),
				error
					? el(
							"div",
							{
								style:
									"color: var(--danger); background: var(--danger-bg); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem;",
							},
							[error],
						)
					: null,
			],
		);

		target.replaceChildren(lead, form);
	}

	rerender();
}
