"use client";

import { useState } from "react";

import type { FormSchema } from "@/server/api/routers/biab";
import { api } from "@/trpc/react";

export function ContactForm({
	schema,
	slug,
}: {
	schema: FormSchema;
	slug: string;
}) {
	const [data, setData] = useState<Record<string, string>>({});
	const [confirmation, setConfirmation] = useState<string | null>(null);

	const submit = api.biab.submitForm.useMutation({
		onSuccess: () => {
			setConfirmation("Thanks — we'll be in touch within one business day.");
			setData({});
		},
	});

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		submit.mutate({
			slug,
			data,
			submitterEmail: data.email,
			submitterName: data.name,
		});
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
									setData({ ...data, [field.id]: e.target.value })
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
									setData({ ...data, [field.id]: e.target.value })
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
					disabled={submit.isPending}
					style={{ alignSelf: "flex-start" }}
					type="submit"
				>
					{submit.isPending ? "Sending…" : "Send message"}
				</button>
				{submit.error ? (
					<div
						style={{
							color: "var(--danger)",
							background: "var(--danger-bg)",
							padding: "0.75rem 1rem",
							borderRadius: "0.5rem",
							fontSize: "0.9rem",
						}}
					>
						{submit.error.message}
					</div>
				) : null}
			</form>
		</section>
	);
}
