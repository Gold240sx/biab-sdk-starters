<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { initBiabAnalytics } from '@biab-dev/sdk/analytics-core';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	onMount(() => {
		if (!browser) return;
		const siteId = import.meta.env.PUBLIC_BIAB_SITE_ID;
		const baseUrl = import.meta.env.PUBLIC_BIAB_PACKAGE_API_BASE_URL;
		const apiKey = import.meta.env.PUBLIC_BIAB_PUBLIC_KEY;
		if (!siteId || !baseUrl || !apiKey) return;
		const tracker = initBiabAnalytics({ siteId, baseUrl, apiKey });
		return () => tracker.stop();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a
			href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}
		>{locale}</a>
	{/each}
</div>
