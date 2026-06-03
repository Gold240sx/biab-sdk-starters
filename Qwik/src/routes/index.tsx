import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, routeLoader$ } from "@builder.io/qwik-city";
import { initBiabAnalytics } from "@biab-dev/sdk/analytics-core";

import { About } from "../components/biab/About";
import { Blog, type BlogPost } from "../components/biab/Blog";
import { Booking, type EventType } from "../components/biab/Booking";
import {
	ContactForm,
	type FormSchema,
} from "../components/biab/ContactForm";
import { Footer } from "../components/biab/Footer";
import { Gallery, type GalleryItem } from "../components/biab/Gallery";
import { Header } from "../components/biab/Header";
import { Hero, type HeroData } from "../components/biab/Hero";
import { Services, type Service } from "../components/biab/Services";
import { getBiab } from "../lib/biab";

/**
 * `routeLoader$` runs on the server before render. Five SDK calls
 * fan out in parallel; the page renders with the resolved data
 * (no client-side flicker). The bearer key never enters the
 * browser bundle because everything inside the `$` is
 * server-only.
 */

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

export const useBiabData = routeLoader$(async () => {
	const biab = getBiab();
	if (!biab) {
		return {
			hero: HERO_DEFAULTS,
			about: ABOUT_FALLBACK,
			services: SERVICES_FALLBACK,
			gallery: [] as GalleryItem[],
			eventTypes: [] as EventType[],
			blogPosts: [] as BlogPost[],
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
		} satisfies HeroData,
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

export default component$(() => {
	const data = useBiabData();

	useVisibleTask$(() => {
		const siteId = import.meta.env.PUBLIC_BIAB_SITE_ID as
			| string
			| undefined;
		const baseUrl = import.meta.env.PUBLIC_BIAB_PACKAGE_API_BASE_URL as
			| string
			| undefined;
		const apiKey = import.meta.env.PUBLIC_BIAB_PUBLIC_KEY as
			| string
			| undefined;
		if (!siteId || !baseUrl || !apiKey) return;
		const tracker = initBiabAnalytics({ siteId, baseUrl, apiKey });
		return () => tracker.stop();
	});

	return (
		<>
			<Header />
			<main>
				<Hero hero={data.value.hero} />
				<About body={data.value.about} />
				<Services services={data.value.services} />
				<Gallery items={data.value.gallery} />
				<Booking eventTypes={data.value.eventTypes} />
				<Blog posts={data.value.blogPosts} />
				<ContactForm schema={data.value.formSchema} slug={data.value.formSlug} />
			</main>
			<Footer />
		</>
	);
});

export const head: DocumentHead = {
	title: "Your Business — built on BIAB",
	meta: [
		{
			name: "description",
			content:
				"Qwik City starter showing how to consume the BIAB SDK via routeLoader$ + server$, with resumable client interactivity for the booking and contact flows.",
		},
	],
};
