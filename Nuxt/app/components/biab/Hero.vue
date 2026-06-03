<script setup lang="ts">
import type { HeroData } from "../../../server/api/biab/home.get";

defineProps<{ hero: HeroData }>();
</script>

<template>
	<section class="hero" id="hero">
		<span class="biab-badge">Open · Mon–Sat</span>
		<h1 class="hero__title">{{ hero.title }}</h1>
		<p class="hero__sub">{{ hero.tagline }}</p>
		<a class="biab-btn" :href="hero.ctaHref">{{ hero.ctaLabel }}</a>
	</section>
</template>
