import type { BlogPost } from "@/server/api/routers/biab";

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

export function Blog({ posts }: { posts: BlogPost[] }) {
	return (
		<section className="biab-section" id="blog">
			<div className="biab-section__lead">
				<span className="biab-section__eyebrow">Latest</span>
				<h2 className="biab-section__title">From the blog</h2>
				<p className="biab-section__sub">
					Tips, customer stories, and what we're working on this month.
				</p>
			</div>
			{posts.length === 0 ? (
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
