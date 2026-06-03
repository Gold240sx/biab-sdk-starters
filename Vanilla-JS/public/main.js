/**
 * Entry point. Each section is its own ES module under
 * `/sections/`; we import them in parallel and let the browser
 * mount each one into its anchor div from `index.html`.
 *
 * Order matches the React-Bun and the upcoming Astro/Nuxt/etc.
 * starters so the same generic business site lands in any
 * framework you pick.
 */

import { renderAbout } from "./sections/about.js";
import { renderBlog } from "./sections/blog.js";
import { renderBooking } from "./sections/booking.js";
import { renderContactForm } from "./sections/contact-form.js";
import { renderGallery } from "./sections/gallery.js";
import { renderHero } from "./sections/hero.js";
import { renderServices } from "./sections/services.js";

document.getElementById("year").textContent = String(new Date().getFullYear());

const mount = (id, render) => {
	const el = document.getElementById(id);
	if (el) render(el).catch((err) => console.error(`[biab] ${id} failed`, err));
};

mount("hero", renderHero);
mount("about", renderAbout);
mount("services", renderServices);
mount("gallery", renderGallery);
mount("booking", renderBooking);
mount("blog", renderBlog);
mount("contact", renderContactForm);

// Privacy-conscious site analytics. Config is injected by the
// Bun server (see server.ts) as `window.__BIAB_PUBLIC__` so the
// public key never lives in the static bundle.
const cfg =
	(typeof window !== "undefined" &&
		(window).__BIAB_PUBLIC__) ||
	null;
if (cfg && cfg.siteId && cfg.baseUrl && cfg.apiKey) {
	import("@biab-dev/sdk/analytics-core").then(({ initBiabAnalytics }) => {
		initBiabAnalytics({
			siteId: cfg.siteId,
			baseUrl: cfg.baseUrl,
			apiKey: cfg.apiKey,
		});
	});
}
