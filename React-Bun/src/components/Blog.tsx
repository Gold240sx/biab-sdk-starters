import { useEffect, useState } from "react";

import { biab } from "../lib/biab";

type BlogPost = {
	id: string;
	slug: string;
	title: string;
	excerpt?: string | null;
	publishedAt?: string | null;
};

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

/**
 * Most recent blog posts via the SDK's blog resource.
 * Webhook-cached on the BIAB side — when the org publishes a post,
 * the Cache-Tag invalidation flushes this list within seconds.
 */
export function Blog() {
	const [posts, setPosts] = useState<BlogPost[] | null>(null);

	useEffect(() => {
		biab.blog
			.listPosts({ limit: 6 })
			.then((result) => {
				const items = ((result?.items as BlogPost[] | undefined) ?? []).map(
					(p) => ({
						id: p.id,
						slug: p.slug,
						title: p.title,
						excerpt: p.excerpt ?? null,
						publishedAt: p.publishedAt ?? null,
					}),
				);
				setPosts(items);
			})
			.catch(() => setPosts([]));
	}, []);

	return (
		<section className="biab-section" id="blog">
			<div className="biab-section__lead">
				<span className="biab-section__eyebrow">Latest</span>
				<h2 className="biab-section__title">From the blog</h2>
				<p className="biab-section__sub">
					Tips, customer stories, and what we're working on this month.
				</p>
			</div>
			{posts === null ? (
				<div className="biab-loading">Loading posts…</div>
			) : posts.length === 0 ? (
				<div className="biab-empty">
					No blog posts published yet. Add one in BIAB and it'll appear here.
				</div>
			) : (
				<div className="biab-grid-3">
					{posts.map((post) => (
						<a
							className="biab-card blog-card"
							href={`/blog/${post.slug}`}
							key={post.id}
						>
							<span className="blog-card__meta">
								{formatDate(post.publishedAt)}
							</span>
							<h3>{post.title}</h3>
							{post.excerpt ? <p>{post.excerpt}</p> : null}
						</a>
					))}
				</div>
			)}
		</section>
	);
}
