import { biab, el, empty, loading } from "../biab.js";

function formatDate(iso) {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

/** @param {HTMLElement} target */
export async function renderBlog(target) {
	target.replaceChildren(
		el("div", { class: "biab-section__lead" }, [
			el("span", { class: "biab-section__eyebrow" }, ["Latest"]),
			el("h2", { class: "biab-section__title" }, ["From the blog"]),
			el("p", { class: "biab-section__sub" }, [
				"Tips, customer stories, and what we're working on this month.",
			]),
		]),
		loading("Loading posts…"),
	);

	let posts = [];
	try {
		const result = await biab.blog.listPosts({ limit: 6 });
		posts = result?.items ?? [];
	} catch {
		posts = [];
	}

	const lead = target.firstChild;
	target.replaceChildren(lead);

	if (posts.length === 0) {
		target.append(
			empty(
				"No blog posts published yet. Add one in BIAB and it'll appear here.",
			),
		);
		return;
	}

	target.append(
		el(
			"div",
			{ class: "biab-grid-3" },
			posts.map((post) =>
				el(
					"a",
					{ class: "biab-card blog-card", href: `/blog/${post.slug}` },
					[
						el("span", { class: "blog-card__meta" }, [
							formatDate(post.publishedAt),
						]),
						el("h3", {}, [post.title]),
						post.excerpt ? el("p", {}, [post.excerpt]) : null,
					],
				),
			),
		),
	);
}
