/**
 * GET /api/biab/home
 *
 * Aggregates every static surface the home page renders into one
 * round-trip. Called from `app/pages/index.vue` via `useFetch`,
 * which runs server-side during SSR and hydrates the resulting
 * payload — no re-fetch on the client.
 */

export type HeroData = {
	title: string;
	tagline: string;
	ctaLabel: string;
	ctaHref: string;
};

export type Service = {
	id: string;
	title: string;
	description: string;
	basePrice?: number;
	priceType?: string;
};

export type GalleryItem = {
	id: string;
	src?: string | null;
	title?: string | null;
	category?: string | null;
	blurDataURL?: string | null;
};

export type EventType = {
	id: string;
	name: string;
	slug: string;
	durationMinutes: number;
};

export type BlogPost = {
	id: string;
	slug: string;
	title: string;
	excerpt?: string | null;
	publishedAt?: string | null;
};

export type FieldDef = {
	id: string;
	label: string;
	type: string;
	required: boolean;
	placeholder?: string;
	helpText?: string;
};

export type FormSchema = {
	id: string;
	slug: string;
	title?: string;
	description?: string | null;
	fields: FieldDef[];
};

export type HomeData = {
	hero: HeroData;
	about: string;
	services: Service[];
	gallery: GalleryItem[];
	eventTypes: EventType[];
	blogPosts: BlogPost[];
	formSchema: FormSchema;
	formSlug: string;
};

const HERO_DEFAULTS: HeroData = {
	title: "Service that shows up — on time.",
	tagline: "Book in 60 seconds. We'll handle the rest.",
	ctaLabel: "Book a consult",
	ctaHref: "#booking",
};

const ABOUT_FALLBACK =
	"We're a small team that takes pride in being available. Real schedule, real reviews, real follow-up — no automated runaround. Book a slot below or send us a note and we'll get right back to you.";

const SERVICES_FALLBACK: Service[] = [
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

const FORM_SLUG = "contact";

const FORM_FALLBACK: FormSchema = {
	id: "fallback",
	slug: FORM_SLUG,
	title: "Get in touch",
	description: "We'll get back within one business day.",
	fields: [
		{ id: "name", label: "Name", type: "text", required: true },
		{ id: "email", label: "Email", type: "email", required: true },
		{ id: "message", label: "Message", type: "textarea", required: true },
	],
};

const GALLERY_FIELDS = ["id", "src", "title", "category", "blurDataURL"] as const;

export default defineEventHandler(async (): Promise<HomeData> => {
	const biab = getBiab();
	if (!biab) {
		return {
			hero: HERO_DEFAULTS,
			about: ABOUT_FALLBACK,
			services: SERVICES_FALLBACK,
			gallery: [],
			eventTypes: [],
			blogPosts: [],
			formSchema: FORM_FALLBACK,
			formSlug: FORM_SLUG,
		};
	}

	const [bundle, gallery, eventTypes, blog, formSchema] = await Promise.all([
		biab.marketing
			.getPageBundle({ pageKey: "home", locale: "en" })
			.catch(() => null),
		biab.gallery
			.list({ limit: 12, fields: GALLERY_FIELDS })
			.catch(() => []) as Promise<GalleryItem[]>,
		biab.scheduling.listEventTypes().catch(() => []) as Promise<EventType[]>,
		biab.blog
			.listPosts({ limit: 6 })
			.catch(() => ({ items: [] as BlogPost[] })),
		biab.forms.schema(FORM_SLUG).catch(() => FORM_FALLBACK),
	]);

	function readSection(name: string): Record<string, unknown> | null {
		const raw = (bundle as { sections?: Record<string, unknown> })?.sections?.[
			name
		];
		if (
			raw &&
			typeof raw === "object" &&
			"ok" in raw &&
			(raw as { ok: boolean }).ok
		) {
			return (raw as unknown as { data: Record<string, unknown> }).data;
		}
		return null;
	}

	const heroSection = readSection("hero");
	const aboutSection = readSection("about");
	const servicesSection = readSection("services");

	return {
		hero: {
			title: (heroSection?.title as string) ?? HERO_DEFAULTS.title,
			tagline: (heroSection?.tagline as string) ?? HERO_DEFAULTS.tagline,
			ctaLabel: (heroSection?.ctaLabel as string) ?? HERO_DEFAULTS.ctaLabel,
			ctaHref: (heroSection?.ctaHref as string) ?? HERO_DEFAULTS.ctaHref,
		},
		about:
			typeof aboutSection?.body === "string"
				? aboutSection.body
				: ABOUT_FALLBACK,
		services:
			Array.isArray(servicesSection?.items) &&
			(servicesSection.items as Service[]).length > 0
				? (servicesSection.items as Service[])
				: SERVICES_FALLBACK,
		gallery,
		eventTypes,
		blogPosts: ((blog as { items?: BlogPost[] })?.items as BlogPost[]) ?? [],
		formSchema,
		formSlug: FORM_SLUG,
	};
});
