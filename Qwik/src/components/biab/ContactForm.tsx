import { $, component$, useSignal } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";

import { getBiab } from "../../lib/biab";

export interface FieldDef {
	id: string;
	label: string;
	type: string;
	required: boolean;
	placeholder?: string;
	helpText?: string;
}

export interface FormSchema {
	id: string;
	slug: string;
	title?: string;
	description?: string | null;
	fields: FieldDef[];
}

/**
 * Server RPC — runs only on the server. The SDK's
 * `validateFormSubmission` runs server-side before persisting, so
 * a missing required field throws here without writing to BIAB.
 */
const submitForm = server$(async function (
	this,
	slug: string,
	data: Record<string, unknown>,
) {
	const biab = getBiab();
	if (!biab) throw new Error("BIAB not configured.");
	return await biab.forms.submit(slug, data, {
		submitterEmail: (data.email as string | undefined) ?? undefined,
		submitterName: (data.name as string | undefined) ?? undefined,
	});
});

export const ContactForm = component$<{ schema: FormSchema; slug: string }>(
	({ schema, slug }) => {
		const submitting = useSignal(false);
		const confirmation = useSignal<string | null>(null);
		const error = useSignal<string | null>(null);
		// Use a single store-shaped signal for the form values; each
		// field's input writes back to it via `onInput$`.
		const data = useSignal<Record<string, string>>({});

		// `preventdefault:submit` on the <form> handles the default
		// suppression — Qwik warns if we also call event.preventDefault()
		// from an async handler (it would fire too late).
		const handleSubmit = $(async () => {
			submitting.value = true;
			error.value = null;
			try {
				await submitForm(slug, data.value);
				confirmation.value =
					"Thanks — we'll be in touch within one business day.";
				data.value = {};
			} catch (err) {
				error.value = err instanceof Error ? err.message : "Couldn't submit.";
			} finally {
				submitting.value = false;
			}
		});

		if (confirmation.value) {
			return (
				<section class="biab-section biab-section--narrow" id="contact">
					<div class="biab-card contact">
						<span class="biab-badge" style="align-self: flex-start;">
							Received
						</span>
						<h2 class="biab-section__title">Got it.</h2>
						<p>{confirmation.value}</p>
					</div>
				</section>
			);
		}

		return (
			<section class="biab-section biab-section--narrow" id="contact">
				<div class="biab-section__lead">
					<span class="biab-section__eyebrow">Contact</span>
					<h2 class="biab-section__title">{schema.title ?? "Get in touch"}</h2>
					{schema.description ? (
						<p class="biab-section__sub">{schema.description}</p>
					) : null}
				</div>
				<form
					class="biab-card contact"
					onSubmit$={handleSubmit}
					preventdefault:submit
				>
					{schema.fields.map((field) => (
						<div key={field.id}>
							<label class="biab-label" for={`field-${field.id}`}>
								{field.label}
								{field.required ? " *" : ""}
							</label>
							{field.type === "textarea" ? (
								<textarea
									class="biab-textarea"
									id={`field-${field.id}`}
									name={field.id}
									onInput$={(_, target) => {
										data.value = {
											...data.value,
											[field.id]: (target as HTMLTextAreaElement).value,
										};
									}}
									placeholder={field.placeholder ?? ""}
									required={field.required}
									value={data.value[field.id] ?? ""}
								/>
							) : (
								<input
									class="biab-input"
									id={`field-${field.id}`}
									name={field.id}
									onInput$={(_, target) => {
										data.value = {
											...data.value,
											[field.id]: (target as HTMLInputElement).value,
										};
									}}
									placeholder={field.placeholder ?? ""}
									required={field.required}
									type={field.type === "email" ? "email" : "text"}
									value={data.value[field.id] ?? ""}
								/>
							)}
							{field.helpText ? (
								<small style="color: var(--text-muted);">
									{field.helpText}
								</small>
							) : null}
						</div>
					))}
					<button
						class="biab-btn"
						disabled={submitting.value}
						style="align-self: flex-start;"
						type="submit"
					>
						{submitting.value ? "Sending…" : "Send message"}
					</button>
					{error.value ? (
						<div style="color: var(--danger); background: var(--danger-bg); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem;">
							{error.value}
						</div>
					) : null}
				</form>
			</section>
		);
	},
);
