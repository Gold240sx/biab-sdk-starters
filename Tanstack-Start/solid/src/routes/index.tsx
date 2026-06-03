import { createFileRoute } from "@tanstack/solid-router";

import { About } from "../components/biab/About";
import { Blog } from "../components/biab/Blog";
import { Booking } from "../components/biab/Booking";
import { ContactForm } from "../components/biab/ContactForm";
import { BiabFooter } from "../components/biab/Footer";
import { Gallery } from "../components/biab/Gallery";
import { BiabHeader } from "../components/biab/Header";
import { Hero } from "../components/biab/Hero";
import { Services } from "../components/biab/Services";
import { getHomeData } from "../lib/biab-server-fns";

/**
 * `loader` runs `getHomeData` (a `createServerFn`) — server-side
 * during SSR, server-side again on client navigation. Five SDK
 * calls fan out in parallel; the component receives the fully
 * resolved data via `useLoaderData()`. No spinners, no client
 * key, no transport boilerplate.
 */
export const Route = createFileRoute("/")({
	component: App,
	loader: () => getHomeData(),
});

function App() {
	const data = Route.useLoaderData();

	return (
		<>
			<BiabHeader />
			<main>
				<Hero hero={data().hero} />
				<About body={data().about} />
				<Services services={data().services} />
				<Gallery items={data().gallery} />
				<Booking eventTypes={data().eventTypes} />
				<Blog posts={data().blogPosts} />
				<ContactForm schema={data().formSchema} slug={data().formSlug} />
			</main>
			<BiabFooter />
		</>
	);
}
