import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";

import {
	loadAbout,
	loadBlog,
	loadHero,
	loadServices,
	submitContact,
} from "~/lib/sdk-sections.server";

export const meta: MetaFunction = () => [
	{ title: "Your Business — built on BIAB" },
	{
		name: "description",
		content:
			"Remix starter showing how to consume the BIAB SDK in server loader functions with Form-driven actions.",
	},
];

export async function loader(_: LoaderFunctionArgs) {
	const [hero, about, services, blog] = await Promise.all([
		loadHero(),
		loadAbout(),
		loadServices(),
		loadBlog(),
	]);
	return { hero, about, services, blog };
}

export async function action({ request }: ActionFunctionArgs) {
	const fd = await request.formData();
	const name = String(fd.get("name") ?? "");
	const email = String(fd.get("email") ?? "");
	const message = String(fd.get("message") ?? "");
	if (!name || !email) {
		return { ok: false as const, reason: "Name and email are required." };
	}
	return submitContact({ name, email, message });
}

export default function Index() {
	const { hero, about, services, blog } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const nav = useNavigation();
	const submitting = nav.state === "submitting";
	const contactSent = actionData?.ok === true;
	return (
		<>
			<header className="header">
				<a className="brand" href="#hero">
					Your Business
				</a>
				<nav>
					<a href="#about">About</a>
					<a href="#services">Services</a>
					<a href="#blog">Blog</a>
					<a href="#contact">Contact</a>
				</nav>
			</header>
			<main>
				<section className="hero" id="hero">
					<span className="biab-badge">Open · Mon–Sat</span>
					<h1 className="hero__title">{hero.title}</h1>
					<p className="hero__sub">{hero.tagline}</p>
					<a className="biab-btn" href={hero.ctaHref}>
						{hero.ctaLabel}
					</a>
				</section>
				<section className="section" id="about">
					<h2 className="section__title">About</h2>
					{about.map((block) => (
						<article className="card" key={block.heading}>
							<h3>{block.heading}</h3>
							<p>{block.body}</p>
						</article>
					))}
				</section>
				<section className="section" id="services">
					<h2 className="section__title">Services</h2>
					<div className="grid">
						{services.map((s) => (
							<article className="card" key={s.id}>
								<h3>{s.name}</h3>
								<p>{s.description}</p>
								<span className="price">{s.priceLabel}</span>
							</article>
						))}
					</div>
				</section>
				<section className="section" id="blog">
					<h2 className="section__title">From the blog</h2>
					{blog.length === 0 ? (
						<p className="muted">
							No posts yet — author them in BIAB and they appear here.
						</p>
					) : (
						<ul className="post-list">
							{blog.map((post) => (
								<li key={post.slug}>
									<a href={`/blog/${post.slug}`}>
										<strong>{post.title}</strong>
										<span className="muted">{post.publishedAt}</span>
									</a>
									<p>{post.excerpt}</p>
								</li>
							))}
						</ul>
					)}
				</section>
				<section className="section" id="contact">
					<h2 className="section__title">Get in touch</h2>
					{contactSent ? (
						<p className="muted">Thanks — we'll be in touch.</p>
					) : (
						<Form method="post">
							<label>
								Name
								<input name="name" required autoComplete="name" />
							</label>
							<label>
								Email
								<input
									name="email"
									type="email"
									required
									autoComplete="email"
								/>
							</label>
							<label>
								How can we help?
								<textarea name="message" rows={3} />
							</label>
							<button
								className="biab-btn"
								type="submit"
								disabled={submitting}
							>
								{submitting ? "Sending…" : "Send"}
							</button>
							{actionData && actionData.ok === false ? (
								<p className="error">{actionData.reason ?? "Couldn't send."}</p>
							) : null}
						</Form>
					)}
				</section>
			</main>
			<footer className="footer">
				<p>© {new Date().getFullYear()} Your Business — built on BIAB.</p>
			</footer>
		</>
	);
}
