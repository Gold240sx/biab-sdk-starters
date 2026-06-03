import type { Service } from "@/server/api/routers/biab";

function formatPrice(s: Service): string {
	if (typeof s.basePrice !== "number") return "Quote on request";
	const prefix = s.priceType === "starting" ? "From " : "";
	return `${prefix}$${s.basePrice}`;
}

export function Services({ services }: { services: Service[] }) {
	return (
		<section className="biab-section" id="services">
			<div className="biab-section__lead">
				<span className="biab-section__eyebrow">What we do</span>
				<h2 className="biab-section__title">Services</h2>
				<p className="biab-section__sub">
					Clear scope, clear price. Add-ons quoted before any work starts.
				</p>
			</div>
			<div className="biab-grid-3">
				{services.map((service) => (
					<article className="biab-card service-card" key={service.id}>
						<h3>{service.title}</h3>
						<p>{service.description}</p>
						<div className="service-card__price">{formatPrice(service)}</div>
					</article>
				))}
			</div>
		</section>
	);
}
