import type { PageServerLoad } from "./$types";

import { biab } from "$lib/server/biab";

/**
 * Server-side load — runs on every request and only on the server,
 * so the bearer key never enters the client bundle. We fetch every
 * "static" surface in parallel so SSR rendering blocks on whichever
 * SDK call is slowest (rarely > 200ms in practice).
 *
 * Interactive surfaces (slot computation, booking submit, contact
 * submit) hit `+server.ts` endpoints under `src/routes/api/biab/`
 * so client `fetch()` never sees the bearer key.
 */

const HERO_DEFAULTS = {
	title: "Service that shows up — on time.",
	tagline: "Book in 60 seconds. We'll handle the rest.",
	ctaLabel: "Book a consult",
	ctaHref: "#booking",
};

const ABOUT_FALLBACK =
	"We're a small team that takes pride in being available. Real schedule, real reviews, real follow-up — no automated runaround. Book a slot below or send us a note and we'll get right back to you.";

const SERVICES_FALLBACK = [
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
const FORM_FALLBACK = {
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

export const load: PageServerLoad = async () => {
	if (!biab) {
		return {
			configured: false as const,
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
		biab.marketing.getPageBundle({ pageKey: "home", locale: "en" }).catch(() => null),
		biab.gallery.list({ limit: 12, fields: GALLERY_FIELDS }).catch(() => []),
		biab.scheduling.listEventTypes().catch(() => []),
		biab.blog.listPosts({ limit: 6 }).catch(() => ({ items: [] as unknown[] })),
		biab.forms.schema(FORM_SLUG).catch(() => FORM_FALLBACK),
	]);

	function readSection(name: string): Record<string, unknown> | null {
		const raw = (bundle as { sections?: Record<string, unknown> })?.sections?.[name];
		if (raw && typeof raw === "object" && "ok" in raw && (raw as { ok: boolean }).ok) {
			return (raw as unknown as { data: Record<string, unknown> }).data;
		}
		return null;
	}

	const heroSection = readSection("hero");
	const aboutSection = readSection("about");
	const servicesSection = readSection("services");

	return {
		configured: true as const,
		hero: {
			title: (heroSection?.title as string) ?? HERO_DEFAULTS.title,
			tagline: (heroSection?.tagline as string) ?? HERO_DEFAULTS.tagline,
			ctaLabel: (heroSection?.ctaLabel as string) ?? HERO_DEFAULTS.ctaLabel,
			ctaHref: (heroSection?.ctaHref as string) ?? HERO_DEFAULTS.ctaHref,
		},
		about:
			typeof aboutSection?.body === "string" ? aboutSection.body : ABOUT_FALLBACK,
		services:
			Array.isArray(servicesSection?.items) && servicesSection.items.length > 0
				? (servicesSection.items as typeof SERVICES_FALLBACK)
				: SERVICES_FALLBACK,
		gallery,
		eventTypes,
		blogPosts: ((blog as { items?: unknown[] })?.items as Array<{
			id: string;
			slug: string;
			title: string;
			excerpt?: string | null;
			publishedAt?: string | null;
		}>) ?? [],
		formSchema,
		formSlug: FORM_SLUG,
	};
};
