import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { getBiab } from "../lib/biab";

/**
 * Tiny contact form. Reactive forms (per project conventions),
 * posts to the BIAB SDK's forms endpoint. The form slug is
 * configurable via env (PUBLIC_BIAB_CONTACT_FORM_SLUG) — the
 * default 'contact' matches the slug the marketing bundle seeds
 * for a new tenant.
 */
@Component({
	selector: "biab-contact-form",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ReactiveFormsModule],
	template: `
		<section class="section" id="contact">
			<h2 class="section__title">Get in touch</h2>
			@if (status() === "sent") {
				<p class="muted">Thanks — we'll be in touch.</p>
			} @else {
				<form [formGroup]="form" (ngSubmit)="submit()">
					<label>
						Name
						<input formControlName="name" autocomplete="name" />
					</label>
					<label>
						Email
						<input formControlName="email" type="email" autocomplete="email" />
					</label>
					<label>
						How can we help?
						<textarea formControlName="message" rows="3"></textarea>
					</label>
					<button
						class="biab-btn"
						type="submit"
						[disabled]="status() === 'sending' || form.invalid"
					>
						{{ status() === "sending" ? "Sending…" : "Send" }}
					</button>
					@if (status() === "error") {
						<p class="error">Couldn't send. Try again or call us directly.</p>
					}
				</form>
			}
		</section>
	`,
})
export class ContactFormComponent {
	readonly status = signal<"idle" | "sending" | "sent" | "error">("idle");

	readonly form = new FormGroup({
		name: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
		email: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required, Validators.email],
		}),
		message: new FormControl("", { nonNullable: true }),
	});

	async submit() {
		if (this.form.invalid) return;
		this.status.set("sending");
		const biab = getBiab();
		if (!biab) {
			window.location.href = `mailto:hello@example.com?subject=Contact&body=${encodeURIComponent(
				this.form.controls.message.value,
			)}`;
			this.status.set("sent");
			return;
		}
		try {
			await biab.forms.submit({
				slug: "contact",
				fields: {
					name: this.form.controls.name.value,
					email: this.form.controls.email.value,
					message: this.form.controls.message.value,
				},
			});
			this.status.set("sent");
		} catch {
			this.status.set("error");
		}
	}
}
