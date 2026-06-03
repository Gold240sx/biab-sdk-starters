<script setup lang="ts">
import type { BlogPost } from "../../../server/api/biab/home.get";

defineProps<{ posts: BlogPost[] }>();

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
</script>

<template>
	<section class="biab-section" id="blog">
		<div class="biab-section__lead">
			<span class="biab-section__eyebrow">Latest</span>
			<h2 class="biab-section__title">From the blog</h2>
			<p class="biab-section__sub">
				Tips, customer stories, and what we're working on this month.
			</p>
		</div>
		<div v-if="posts.length === 0" class="biab-empty">
			No blog posts published yet. Add one in BIAB and it'll appear here.
		</div>
		<div v-else class="biab-grid-3">
			<a
				v-for="post in posts"
				:key="post.id"
				class="biab-card blog-card"
				:href="`/blog/${post.slug}`"
			>
				<span class="blog-card__meta">{{ formatDate(post.publishedAt) }}</span>
				<h3>{{ post.title }}</h3>
				<p v-if="post.excerpt">{{ post.excerpt }}</p>
			</a>
		</div>
	</section>
</template>
