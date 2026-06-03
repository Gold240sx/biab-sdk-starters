<script setup lang="ts">
import type { GalleryItem } from "../../../server/api/biab/home.get";

defineProps<{ items: GalleryItem[] }>();
</script>

<template>
	<section class="biab-section" id="gallery">
		<div class="biab-section__lead">
			<span class="biab-section__eyebrow">Recent work</span>
			<h2 class="biab-section__title">Gallery</h2>
			<p class="biab-section__sub">
				Pulled live from the BIAB gallery surface. Each tile only fetches the
				fields it actually displays.
			</p>
		</div>
		<div v-if="items.length === 0" class="biab-empty">
			No gallery items yet. Add a few in BIAB and they'll appear here.
		</div>
		<div v-else class="biab-grid-4">
			<div
				v-for="item in items"
				:key="item.id"
				class="biab-card gallery-tile"
			>
				<img
					v-if="item.src"
					:alt="item.title ?? item.category ?? 'Gallery item'"
					loading="lazy"
					:src="item.src"
					:style="
						item.blurDataURL
							? `background-image: url(${item.blurDataURL}); background-size: cover;`
							: undefined
					"
				/>
				<div
					v-if="item.title || item.category"
					class="gallery-tile__caption"
				>
					{{ item.title ?? item.category }}
				</div>
			</div>
		</div>
	</section>
</template>
