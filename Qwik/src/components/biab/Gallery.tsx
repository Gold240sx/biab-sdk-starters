import { component$ } from "@builder.io/qwik";

export interface GalleryItem {
	id: string;
	src?: string | null;
	title?: string | null;
	category?: string | null;
	blurDataURL?: string | null;
}

export const Gallery = component$<{ items: GalleryItem[] }>(({ items }) => {
	return (
		<section class="biab-section" id="gallery">
			<div class="biab-section__lead">
				<span class="biab-section__eyebrow">Recent work</span>
				<h2 class="biab-section__title">Gallery</h2>
				<p class="biab-section__sub">
					Pulled live from the BIAB gallery surface. Each tile only fetches the
					fields it actually displays.
				</p>
			</div>
			{items.length === 0 ? (
				<div class="biab-empty">
					No gallery items yet. Add a few in BIAB and they'll appear here.
				</div>
			) : (
				<div class="biab-grid-4">
					{items.map((item) => (
						<div class="biab-card gallery-tile" key={item.id}>
							{item.src ? (
								<img
									alt={item.title ?? item.category ?? "Gallery item"}
									loading="lazy"
									src={item.src}
									style={
										item.blurDataURL
											? `background-image: url(${item.blurDataURL}); background-size: cover;`
											: undefined
									}
								/>
							) : null}
							{item.title || item.category ? (
								<div class="gallery-tile__caption">
									{item.title ?? item.category}
								</div>
							) : null}
						</div>
					))}
				</div>
			)}
		</section>
	);
});
