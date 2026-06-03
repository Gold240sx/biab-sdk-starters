import { About } from "@/app/_components/biab/About";
import { Blog } from "@/app/_components/biab/Blog";
import { Booking } from "@/app/_components/biab/Booking";
import { ContactForm } from "@/app/_components/biab/ContactForm";
import { BiabFooter } from "@/app/_components/biab/Footer";
import { Gallery } from "@/app/_components/biab/Gallery";
import { BiabHeader } from "@/app/_components/biab/Header";
import { Hero } from "@/app/_components/biab/Hero";
import { Services } from "@/app/_components/biab/Services";
import { api } from "@/trpc/server";

/**
 * Server Component composes the BIAB home. `api.biab.home()`
 * calls the tRPC procedure directly (no HTTP round-trip — it's
 * the same process), gets back the typed data shape, and passes
 * each section's props down. The five static sections render
 * server-side with zero client-side data fetch.
 *
 * Booking + ContactForm are `"use client"` components — they
 * receive their initial data as props from this Server Component,
 * then use the tRPC react hooks (`useQuery`, `useMutation`) for
 * the interactive bits. The bearer key never leaves the server.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
	const data = await api.biab.home();
	return (
		<>
			<BiabHeader />
			<main>
				<Hero hero={data.hero} />
				<About body={data.about} />
				<Services services={data.services} />
				<Gallery items={data.gallery} />
				<Booking eventTypes={data.eventTypes} />
				<Blog posts={data.blogPosts} />
				<ContactForm schema={data.formSchema} slug={data.formSlug} />
			</main>
			<BiabFooter />
		</>
	);
}
