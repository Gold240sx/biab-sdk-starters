import { biab, el } from "../biab.js";

/**
 * Renders the hero into `target`. Reads the marketing bundle's
 * `hero` section if BIAB is configured; otherwise the local defaults
 * keep the page looking real.
 *
 * @param {HTMLElement} target
 */
export async function renderHero(target) {
	const defaults = {
		title: "Service that shows up — on time.",
		tagline: "Book in 60 seconds. We'll handle the rest.",
		ctaLabel: "Book a consult",
		ctaHref: "#booking",
	};

	function paint(data) {
		target.replaceChildren(
			el("span", { class: "biab-badge" }, ["Open · Mon–Sat"]),
			el("h1", { class: "hero__title" }, [data.title]),
			el("p", { class: "hero__sub" }, [data.tagline]),
			el("a", { class: "biab-btn", href: data.ctaHref }, [data.ctaLabel]),
		);
	}

	paint(defaults);

	try {
		const bundle = await biab.marketing.getPageBundle({ pageKey: "home" });
		const raw = bundle?.sections?.hero;
		if (raw?.ok && raw.data) {
			paint({
				title: raw.data.title ?? defaults.title,
				tagline: raw.data.tagline ?? defaults.tagline,
				ctaLabel: raw.data.ctaLabel ?? defaults.ctaLabel,
				ctaHref: raw.data.ctaHref ?? defaults.ctaHref,
			});
		}
	} catch {
		// stay on defaults
	}
}
