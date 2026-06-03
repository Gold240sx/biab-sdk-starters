import { useEffect, useState } from "react";

import { biab, type FormSchema } from "../lib/biab";

/**
 * Demonstrates the SDK's Forms surface end-to-end:
 *
 *   1. Fetch the form schema from BIAB (Class A — admin defined,
 *      cached). The org changes the fields in the dashboard; this
 *      page re-renders accordingly.
 *   2. Render each field dynamically based on its `type`.
 *   3. Submit — `biab.forms.submit(...)` server-side runs the
 *      shared `validateFormSubmission` check, so a missing required
 *      field or bad email is caught before hitting the DB.
 *
 * Replace `FORM_SLUG` with the slug of the form you authored in
 * BIAB at Dashboard → Forms.
 */

const FORM_SLUG = "contact";

const FALLBACK_FIELDS: FormSchema = {
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

export function ContactForm() {
	const [schema, setSchema] = useState<FormSchema>(FALLBACK_FIELDS);
	const [data, setData] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [confirmation, setConfirmation] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		biab.forms
			.schema(FORM_SLUG)
			.then((remote) => setSchema(remote))
			.catch(() => undefined);
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			await biab.forms.submit(FORM_SLUG, data, {
				submitterEmail: (data.email as string | undefined) ?? undefined,
				submitterName: (data.name as string | undefined) ?? undefined,
			});
			setConfirmation("Thanks — we'll be in touch within one business day.");
			setData({});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't submit.");
		} finally {
			setSubmitting(false);
		}
	}

	if (confirmation) {
		return (
			<section className="biab-section biab-section--narrow" id="contact">
				<div className="biab-card contact">
					<span className="biab-badge" style={{ alignSelf: "flex-start" }}>
						Received
					</span>
					<h2 className="biab-section__title">Got it.</h2>
					<p>{confirmation}</p>
				</div>
			</section>
		);
	}

	return (
		<section className="biab-section biab-section--narrow" id="contact">
			<div className="biab-section__lead">
				<span className="biab-section__eyebrow">Contact</span>
				<h2 className="biab-section__title">
					{schema.title ?? "Get in touch"}
				</h2>
				{schema.description ? (
					<p className="biab-section__sub">{schema.description}</p>
				) : null}
			</div>
			<form className="biab-card contact" onSubmit={handleSubmit}>
				{schema.fields.map((field) => (
					<div key={field.id}>
						<label className="biab-label" htmlFor={`field-${field.id}`}>
							{field.label}
							{field.required ? " *" : ""}
						</label>
						{field.type === "textarea" ? (
							<textarea
								className="biab-textarea"
								id={`field-${field.id}`}
								onChange={(e) =>
									setData((s) => ({ ...s, [field.id]: e.target.value }))
								}
								placeholder={field.placeholder ?? ""}
								required={field.required}
								value={data[field.id] ?? ""}
							/>
						) : (
							<input
								className="biab-input"
								id={`field-${field.id}`}
								onChange={(e) =>
									setData((s) => ({ ...s, [field.id]: e.target.value }))
								}
								placeholder={field.placeholder ?? ""}
								required={field.required}
								type={field.type === "email" ? "email" : "text"}
								value={data[field.id] ?? ""}
							/>
						)}
						{field.helpText ? (
							<small style={{ color: "var(--text-muted)" }}>
								{field.helpText}
							</small>
						) : null}
					</div>
				))}
				<button
					className="biab-btn"
					disabled={submitting}
					style={{ alignSelf: "flex-start" }}
					type="submit"
				>
					{submitting ? "Sending…" : "Send message"}
				</button>
				{error ? (
					<div
						style={{
							color: "var(--danger)",
							background: "var(--danger-bg)",
							padding: "0.75rem 1rem",
							borderRadius: "0.5rem",
							fontSize: "0.9rem",
						}}
					>
						{error}
					</div>
				) : null}
			</form>
		</section>
	);
}
