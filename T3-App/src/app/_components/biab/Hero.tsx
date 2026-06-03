import type { HeroData } from "@/server/api/routers/biab";

export function Hero({ hero }: { hero: HeroData }) {
	return (
		<section className="hero" id="hero">
			<span className="biab-badge">Open · Mon–Sat</span>
			<h1 className="hero__title">{hero.title}</h1>
			<p className="hero__sub">{hero.tagline}</p>
			<a className="biab-btn" href={hero.ctaHref}>
				{hero.ctaLabel}
			</a>
		</section>
	);
}
