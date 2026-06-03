<template>
	<div>
		<NuxtRouteAnnouncer />
		<NuxtPage />
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { initBiabAnalytics } from "@biab-dev/sdk/analytics-core";

const config = useRuntimeConfig();
let tracker: ReturnType<typeof initBiabAnalytics> | null = null;

onMounted(() => {
	const siteId = config.public.biabSiteId as string | undefined;
	const baseUrl = config.public.biabPackageApiBaseUrl as string | undefined;
	const apiKey = config.public.biabPublicKey as string | undefined;
	if (!siteId || !baseUrl || !apiKey) return;
	tracker = initBiabAnalytics({ siteId, baseUrl, apiKey });
});

onBeforeUnmount(() => {
	tracker?.stop();
});
</script>
