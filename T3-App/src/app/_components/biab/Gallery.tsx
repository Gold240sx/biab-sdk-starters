import type { GalleryItem } from "@/server/api/routers/biab";

export function Gallery({ items }: { items: GalleryItem[] }) {
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
			{items.length === 0 ? (
				<div className="biab-empty">
					No gallery items yet. Add a few in BIAB and they'll appear here.
				</div>
			) : (
				<div className="biab-grid-4">
					{items.map((item) => (
						<div className="biab-card gallery-tile" key={item.id}>
							{item.src ? (
								// eslint-disable-next-line @next/next/no-img-element
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
