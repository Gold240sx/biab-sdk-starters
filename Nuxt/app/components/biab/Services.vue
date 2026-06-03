<script setup lang="ts">
import type { Service } from "../../../server/api/biab/home.get";

defineProps<{ services: Service[] }>();

function formatPrice(s: Service): string {
	if (typeof s.basePrice !== "number") return "Quote on request";
	const prefix = s.priceType === "starting" ? "From " : "";
	return `${prefix}$${s.basePrice}`;
}
</script>

<template>
	<section class="biab-section" id="services">
		<div class="biab-section__lead">
			<span class="biab-section__eyebrow">What we do</span>
			<h2 class="biab-section__title">Services</h2>
			<p class="biab-section__sub">
				Clear scope, clear price. Add-ons quoted before any work starts.
			</p>
		</div>
		<div class="biab-grid-3">
			<article
				v-for="service in services"
				:key="service.id"
				class="biab-card service-card"
			>
				<h3>{{ service.title }}</h3>
				<p>{{ service.description }}</p>
				<div class="service-card__price">{{ formatPrice(service) }}</div>
			</article>
		</div>
	</section>
</template>
