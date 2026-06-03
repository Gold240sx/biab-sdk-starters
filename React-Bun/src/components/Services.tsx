import { useEffect, useState } from "react";

import { biab } from "../lib/biab";

type Service = {
	id: string;
	title: string;
	description: string;
	basePrice?: number;
	priceType?: string;
};

const FALLBACK: Service[] = [
	{
		id: "f1",
		title: "Standard Service Call",
		description: "Initial visit, diagnosis, and a written estimate.",
		basePrice: 95,
		priceType: "flat",
	},
	{
		id: "f2",
		title: "Tune-up + Inspection",
		description: "Annual maintenance with a 14-point checklist.",
		basePrice: 149,
		priceType: "flat",
	},
	{
		id: "f3",
		title: "Emergency Visit",
		description: "Same-day arrival for urgent issues.",
		basePrice: 225,
		priceType: "starting",
	},
];

function formatPrice(s: Service): string {
	if (typeof s.basePrice !== "number") return "Quote on request";
	const prefix = s.priceType === "starting" ? "From " : "";
	return `${prefix}$${s.basePrice}`;
}

/**
 * Services pulled from the marketing bundle's `services` section
 * (Class A — admin-published). When the org hasn't authored it yet,
 * the local fallback above keeps the page looking real.
 */
export function Services() {
	const [items, setItems] = useState<Service[]>(FALLBACK);

	useEffect(() => {
		biab.marketing
			.getPageBundle({ pageKey: "home" })
			.then((bundle) => {
				const raw = (bundle as { sections?: Record<string, unknown> })?.sections
					?.services;
				if (
					raw &&
					typeof raw === "object" &&
					"ok" in raw &&
					(raw as { ok: boolean }).ok
				) {
					const data = (raw as unknown as { data: Record<string, unknown> })
						.data;
					const list = (data?.items as Service[] | undefined) ?? null;
					if (list && list.length > 0) setItems(list);
				}
			})
			.catch(() => undefined);
	}, []);

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
				{items.map((service) => (
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
