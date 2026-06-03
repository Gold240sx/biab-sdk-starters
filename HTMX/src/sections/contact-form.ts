import { getBiab } from "../biab";
import { html, render } from "../html";

/**
 * Two HTMX renderings:
 *   GET  /sections/contact   → form HTML
 *   POST /sections/contact   → SDK submission, returns either a
 *                              "thanks" fragment or a re-rendered
 *                              form with an error message
 *
 * `hx-target="this"` + `hx-swap="outerHTML"` swaps the form
 * fragment in-place, no full page reload.
 */

export function renderContactForm(): string {
	return render(html`
		<section class="section" id="contact">
			<h2 class="section__title">Get in touch</h2>
			<form
				hx-post="/sections/contact"
				hx-target="this"
				hx-swap="outerHTML"
				hx-indicator="#contact-spinner"
			>
				<label>
					Name
					<input name="name" required autocomplete="name" />
				</label>
				<label>
					Email
					<input name="email" type="email" required autocomplete="email" />
				</label>
				<label>
					How can we help?
					<textarea name="message" rows="3"></textarea>
				</label>
				<button class="biab-btn" type="submit">
					Send <span id="contact-spinner" class="htmx-indicator">…</span>
				</button>
			</form>
		</section>
	`);
}

export async function handleContactSubmit(
	formData: FormData,
): Promise<string> {
	const biab = getBiab();
	const name = String(formData.get("name") ?? "");
	const email = String(formData.get("email") ?? "");
	const message = String(formData.get("message") ?? "");
	if (!name || !email) {
		return render(html`
			<form
				hx-post="/sections/contact"
				hx-target="this"
				hx-swap="outerHTML"
			>
				<p class="error">Name and email are required.</p>
				<label>
					Name
					<input name="name" required autocomplete="name" value="${name}" />
				</label>
				<label>
					Email
					<input
						name="email"
						type="email"
						required
						autocomplete="email"
						value="${email}"
					/>
				</label>
				<label>
					How can we help?
					<textarea name="message" rows="3">${message}</textarea>
				</label>
				<button class="biab-btn" type="submit">Send</button>
			</form>
		`);
	}
	if (!biab) {
		// no SDK configured — show a "we got it locally" message and
		// log so the dev knows to wire env up.
		console.warn("[biab] contact submission received but SDK not configured:", {
			name,
			email,
			message,
		});
		return render(html`<p class="muted">Thanks — we'll be in touch.</p>`);
	}
	try {
		await biab.forms.submit({
			slug: "contact",
			fields: { name, email, message },
		});
		return render(html`<p class="muted">Thanks — we'll be in touch.</p>`);
	} catch (err) {
		console.error("[biab] forms.submit failed:", err);
		return render(html`
			<p class="error">Couldn't send. Try again or call us directly.</p>
		`);
	}
}
