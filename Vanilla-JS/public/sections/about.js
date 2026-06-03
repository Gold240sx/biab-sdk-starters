import { biab, el } from "../biab.js";

/** @param {HTMLElement} target */
export async function renderAbout(target) {
	const fallback =
		"We're a small team that takes pride in being available. Real schedule, real reviews, real follow-up — no automated runaround. Book a slot below or send us a note and we'll get right back to you.";

	function paint(body) {
		target.replaceChildren(
			el("div", { class: "biab-section__lead" }, [
				el("span", { class: "biab-section__eyebrow" }, ["About"]),
				el("h2", { class: "biab-section__title" }, [
					"Built around how you actually work.",
				]),
			]),
			el(
				"p",
				{
					style:
						"color: var(--text); font-size: 1.05rem; text-align: center;",
				},
				[body],
			),
		);
	}

	paint(fallback);

	try {
		const bundle = await biab.marketing.getPageBundle({ pageKey: "home" });
		const raw = bundle?.sections?.about;
		if (raw?.ok && typeof raw.data?.body === "string") paint(raw.data.body);
	} catch {
		// stay on fallback
	}
}
