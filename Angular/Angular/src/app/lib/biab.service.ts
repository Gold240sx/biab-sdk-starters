import { Injectable, signal } from "@angular/core";
import { getBiab } from "./biab";

type Hero = {
	title: string;
	tagline: string;
	ctaLabel: string;
	ctaHref: string;
};

type AboutBlock = {
	heading: string;
	body: string;
};

type Service = {
	id: string;
	name: string;
	description: string;
	priceLabel: string;
};

type BlogPost = {
	slug: string;
	title: string;
	excerpt: string;
	publishedAt: string;
};

const heroDefaults: Hero = {
	title: "Service that shows up — on time.",
	tagline: "Book in 60 seconds. We'll handle the rest.",
	ctaLabel: "Book a consult",
	ctaHref: "#booking",
};

const aboutDefaults: AboutBlock[] = [
	{
		heading: "Family-run for 12 years",
		body: "Honest pricing, the same crew every visit, and the kind of follow-up your neighbour-recommended service should have.",
	},
];

const servicesDefaults: Service[] = [
	{
		id: "tuneup",
		name: "Annual tune-up",
		description: "Pre-season inspection + tune-up.",
		priceLabel: "from $149",
	},
	{
		id: "install",
		name: "Install",
		description: "New equipment install with a 10-year warranty.",
		priceLabel: "quote on site",
	},
	{
		id: "repair",
		name: "Repair",
		description: "Same-day repair for most makes + models.",
		priceLabel: "$95 diagnostic",
	},
];

/**
 * Wraps the BIAB SDK with Angular signals. Each load method fetches
 * once + populates the signal; the section component reads the
 * signal in its template. Defaults render immediately so the page
 * is never blank — the SDK call enriches when it returns.
 */
@Injectable({ providedIn: "root" })
export class BiabService {
	readonly hero = signal<Hero>(heroDefaults);
	readonly about = signal<AboutBlock[]>(aboutDefaults);
	readonly services = signal<Service[]>(servicesDefaults);
	readonly blog = signal<BlogPost[]>([]);

	async loadHero(): Promise<void> {
		const biab = getBiab();
		if (!biab) return;
		try {
			const bundle = await biab.marketing.getPageBundle({
				pageKey: "home",
				locale: "en",
			});
			const raw = (bundle as { sections?: Record<string, unknown> })?.sections
				?.hero;
			if (
				raw &&
				typeof raw === "object" &&
				"ok" in raw &&
				(raw as { ok: boolean }).ok
			) {
				const data = (raw as { data: Record<string, unknown> }).data;
				this.hero.set({
					title: (data?.["title"] as string) ?? heroDefaults.title,
					tagline: (data?.["tagline"] as string) ?? heroDefaults.tagline,
					ctaLabel:
						(data?.["ctaLabel"] as string) ?? heroDefaults.ctaLabel,
					ctaHref: (data?.["ctaHref"] as string) ?? heroDefaults.ctaHref,
				});
			}
		} catch {
			/* keep defaults */
		}
	}

	async loadAbout(): Promise<void> {
		const biab = getBiab();
		if (!biab) return;
		try {
			const bundle = await biab.marketing.getPageBundle({
				pageKey: "home",
				locale: "en",
			});
			const raw = (bundle as { sections?: Record<string, unknown> })?.sections
				?.about;
			if (
				raw &&
				typeof raw === "object" &&
				"ok" in raw &&
				(raw as { ok: boolean }).ok
			) {
				const data = (raw as { data: { blocks?: AboutBlock[] } }).data;
				if (Array.isArray(data?.blocks) && data.blocks.length > 0) {
					this.about.set(data.blocks);
				}
			}
		} catch {
			/* keep defaults */
		}
	}

	async loadServices(): Promise<void> {
		const biab = getBiab();
		if (!biab) return;
		try {
			const list = await biab.store.listProducts({
				limit: 6,
				category: "services",
			});
			if (Array.isArray(list?.items) && list.items.length > 0) {
				this.services.set(
					list.items.map((p) => ({
						id: p.id,
						name: p.name,
						description: p.description ?? "",
						priceLabel:
							p.priceCents != null
								? `from $${(p.priceCents / 100).toFixed(0)}`
								: "quote on site",
					})),
				);
			}
		} catch {
			/* keep defaults */
		}
	}

	async loadBlog(): Promise<void> {
		const biab = getBiab();
		if (!biab) return;
		try {
			const list = await biab.blog.listPosts({ limit: 4 });
			if (Array.isArray(list?.items)) {
				this.blog.set(
					list.items.map((p) => ({
						slug: p.slug,
						title: p.title,
						excerpt: p.excerpt ?? "",
						publishedAt: String(p.publishedAt ?? ""),
					})),
				);
			}
		} catch {
			/* keep empty */
		}
	}
}
