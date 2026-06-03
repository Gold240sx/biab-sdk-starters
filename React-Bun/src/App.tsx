import "./App.css";
import { BIABAnalytics } from "@biab-dev/sdk/react-analytics";
import { About } from "./components/About";
import { Blog } from "./components/Blog";
import { Booking } from "./components/Booking";
import { ContactForm } from "./components/ContactForm";
import { Footer } from "./components/Footer";
import { Gallery } from "./components/Gallery";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";

/**
 * Generic business website wired against the BIAB SDK.
 *
 * Every section reads from the same SDK surface a production
 * consumer site would: marketing bundle for Hero/About/Services
 * (Class A — admin-published content), the typed gallery resource
 * with field selection, blog list, scheduling flow, and the forms
 * runtime validator.
 *
 * The pattern across all 6 framework starters is identical:
 *   browser → same-origin `/api/biab/*` proxy → BIAB Package API.
 * Only the **transport** changes per framework (Bun HTTP here,
 * Astro endpoint, Next route handler, etc.). The component layer
 * stays a pure data-shape concern.
 */
function App() {
	const biabSiteId = import.meta.env.VITE_BIAB_SITE_ID;
	const biabBaseUrl = import.meta.env.VITE_BIAB_PACKAGE_API_BASE_URL;
	const biabPublicKey = import.meta.env.VITE_BIAB_PUBLIC_KEY;
	return (
		<>
			<Header />
			<main>
				<Hero />
				<About />
				<Services />
				<Gallery />
				<Booking />
				<Blog />
				<ContactForm />
			</main>
			<Footer />
			{biabSiteId && biabBaseUrl && biabPublicKey ? (
				<BIABAnalytics
					siteId={biabSiteId}
					baseUrl={biabBaseUrl}
					apiKey={biabPublicKey}
				/>
			) : null}
		</>
	);
}

export default App;
