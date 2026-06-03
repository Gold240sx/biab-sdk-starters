import { useEffect, useState } from "react";

import { biab } from "../lib/biab";

type HeroData = {
	title: string;
	tagline: string;
	ctaLabel: string;
	ctaHref: string;
} | null;

/**
 * Hero pulled from the marketing bundle's `hero` section. Falls
 * back to local defaults when the bundle hasn't been authored yet
 * — same pattern the DGP-2026 + UrbanAirNYC sites use.
 */
export function Hero() {
	const [hero, setHero] = useState<HeroData>(null);

	useEffect(() => {
		biab.marketing
			.getPageBundle({ pageKey: "home" })
			.then((bundle) => {
				const raw = (bundle as { sections?: Record<string, unknown> })?.sections
					?.hero;
				if (
					raw &&
					typeof raw === "object" &&
					"ok" in raw &&
					(raw as { ok: boolean }).ok
				) {
					const data = (raw as unknown as { data: Record<string, unknown> })
						.data;
					setHero({
						title:
							(data?.title as string) ?? "Service that shows up — on time.",
						tagline:
							(data?.tagline as string) ??
							"Book in 60 seconds. We'll handle the rest.",
						ctaLabel: (data?.ctaLabel as string) ?? "Book a consult",
						ctaHref: (data?.ctaHref as string) ?? "#booking",
					});
				}
			})
			.catch(() => undefined);
	}, []);

	const display = hero ?? {
		title: "Service that shows up — on time.",
		tagline: "Book in 60 seconds. We'll handle the rest.",
		ctaLabel: "Book a consult",
		ctaHref: "#booking",
	};

	return (
		<section className="hero">
			<span className="biab-badge">Open · Mon–Sat</span>
			<h1 className="hero__title">{display.title}</h1>
			<p className="hero__sub">{display.tagline}</p>
			<a className="biab-btn" href={display.ctaHref}>
				{display.ctaLabel}
			</a>
		</section>
	);
}
