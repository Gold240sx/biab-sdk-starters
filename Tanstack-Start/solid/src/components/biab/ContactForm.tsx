import { createSignal, For, Show } from "solid-js";

import {
	type FormSchema,
	submitContactForm,
} from "../../lib/biab-server-fns";

export function ContactForm(props: { schema: FormSchema; slug: string }) {
	const [values, setValues] = createSignal<Record<string, string>>({});
	const [submitting, setSubmitting] = createSignal(false);
	const [confirmation, setConfirmation] = createSignal<string | null>(null);
	const [error, setError] = createSignal<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			await submitContactForm({
				data: { slug: props.slug, values: values() },
			});
			setConfirmation(
				"Thanks — we'll be in touch within one business day.",
			);
			setValues({});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't submit.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section class="biab-section biab-section--narrow" id="contact">
			<Show
				when={!confirmation()}
				fallback={
					<div class="biab-card contact">
						<span class="biab-badge" style="align-self: flex-start;">
							Received
						</span>
						<h2 class="biab-section__title">Got it.</h2>
						<p>{confirmation()}</p>
					</div>
				}
			>
				<div class="biab-section__lead">
					<span class="biab-section__eyebrow">Contact</span>
					<h2 class="biab-section__title">
						{props.schema.title ?? "Get in touch"}
					</h2>
					<Show when={props.schema.description}>
						<p class="biab-section__sub">{props.schema.description}</p>
					</Show>
				</div>
				<form class="biab-card contact" onSubmit={handleSubmit}>
					<For each={props.schema.fields}>
						{(field) => (
							<div>
								<label class="biab-label" for={`field-${field.id}`}>
									{field.label}
									{field.required ? " *" : ""}
								</label>
								<Show
									when={field.type === "textarea"}
									fallback={
										<input
											class="biab-input"
											id={`field-${field.id}`}
											onInput={(e) =>
												setValues({
													...values(),
													[field.id]: e.currentTarget.value,
												})
											}
											placeholder={field.placeholder ?? ""}
											required={field.required}
											type={field.type === "email" ? "email" : "text"}
											value={values()[field.id] ?? ""}
										/>
									}
								>
									<textarea
										class="biab-textarea"
										id={`field-${field.id}`}
										onInput={(e) =>
											setValues({
												...values(),
												[field.id]: e.currentTarget.value,
											})
										}
										placeholder={field.placeholder ?? ""}
										required={field.required}
										value={values()[field.id] ?? ""}
									/>
								</Show>
								<Show when={field.helpText}>
									<small style="color: var(--text-muted);">
										{field.helpText}
									</small>
								</Show>
							</div>
						)}
					</For>
					<button
						class="biab-btn"
						disabled={submitting()}
						style="align-self: flex-start;"
						type="submit"
					>
						{submitting() ? "Sending…" : "Send message"}
					</button>
					<Show when={error()}>
						<div style="color: var(--danger); background: var(--danger-bg); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem;">
							{error()}
						</div>
					</Show>
				</form>
			</Show>
		</section>
	);
}
