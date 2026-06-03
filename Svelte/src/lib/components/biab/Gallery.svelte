<script lang="ts">
	type GalleryItem = {
		id: string;
		src?: string | null;
		title?: string | null;
		category?: string | null;
		blurDataURL?: string | null;
	};

	let { items }: { items: GalleryItem[] } = $props();
</script>

<!--
	Server-side, the page load fetched only the columns we'd render.
	By the time this component receives `items`, each one is already
	the typed `Pick<GalleryItem, …>` shape from the SDK.
-->
<section class="biab-section" id="gallery">
	<div class="biab-section__lead">
		<span class="biab-section__eyebrow">Recent work</span>
		<h2 class="biab-section__title">Gallery</h2>
		<p class="biab-section__sub">
			Pulled live from the BIAB gallery surface. Each tile only fetches the
			fields it actually displays.
		</p>
	</div>
	{#if items.length === 0}
		<div class="biab-empty">
			No gallery items yet. Add a few in BIAB and they'll appear here.
		</div>
	{:else}
		<div class="biab-grid-4">
			{#each items as item (item.id)}
				<div class="biab-card gallery-tile">
					{#if item.src}
						<img
							alt={item.title ?? item.category ?? 'Gallery item'}
							loading="lazy"
							src={item.src}
							style={item.blurDataURL
								? `background-image: url(${item.blurDataURL}); background-size: cover;`
								: ''}
						/>
					{/if}
					{#if item.title || item.category}
						<div class="gallery-tile__caption">
							{item.title ?? item.category}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>
