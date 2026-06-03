import { useEffect, useState } from "react";

import { biab, type BundleGalleryItem } from "../lib/biab";

/**
 * Showcases the SDK's **typed field selection** — `fields: [...] as
 * const` narrows the return type so this component only sees the
 * columns it asked for. Server-side, the BIAB Package API SELECTs
 * only those columns; the DB doesn't pay for the unused ones.
 *
 * Change the `fields` literal below and watch TypeScript narrow the
 * `item` shape in the `.map()` — that's the consumer-DX win.
 */
const FIELDS = [
	"id",
	"src",
	"title",
	"category",
	"blurDataURL",
] as const;

type GalleryItem = Pick<BundleGalleryItem, (typeof FIELDS)[number]>;

export function Gallery() {
	const [items, setItems] = useState<GalleryItem[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		biab.gallery
			.list({ limit: 12, fields: FIELDS })
			.then((rows) => setItems(rows))
			.catch((err) => setError(err.message));
	}, []);

	return (
		<section className="biab-section" id="gallery">
			<div className="biab-section__lead">
				<span className="biab-section__eyebrow">Recent work</span>
				<h2 className="biab-section__title">Gallery</h2>
				<p className="biab-section__sub">
					Pulled live from the BIAB gallery surface. Each tile only fetches the
					fields it actually displays.
				</p>
			</div>
			{error ? (
				<div className="biab-empty">Couldn't load gallery: {error}</div>
			) : items === null ? (
				<div className="biab-loading">Loading gallery…</div>
			) : items.length === 0 ? (
				<div className="biab-empty">
					No gallery items yet. Add a few in BIAB and they'll appear here.
				</div>
			) : (
				<div className="biab-grid-4">
					{items.map((item) => (
						<div className="biab-card gallery-tile" key={item.id}>
							{item.src ? (
								<img
									alt={item.title ?? item.category ?? "Gallery item"}
									loading="lazy"
									src={item.src}
									style={
										item.blurDataURL
											? {
													backgroundImage: `url(${item.blurDataURL})`,
													backgroundSize: "cover",
												}
											: undefined
									}
								/>
							) : null}
							{item.title || item.category ? (
								<div className="gallery-tile__caption">
									{item.title ?? item.category}
								</div>
							) : null}
						</div>
					))}
				</div>
			)}
		</section>
	);
}
