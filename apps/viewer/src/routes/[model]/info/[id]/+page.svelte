<script lang="ts" context="module">
	import type { PageLoad } from './$types';

	export const load: PageLoad = async ({ fetch, params }) => {
		const response = await fetch(`/data/info/${params.id}.md`);
		const markdown = response.ok ? await response.text() : '';
		return { markdown };
	};
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import InfoViewer from '$lib/components/InfoViewer.svelte';

	export let data: { markdown: string };
</script>

<section class="flex min-h-screen flex-col gap-6 pb-10">
	<Breadcrumb
		items={[
			{ label: 'Models', href: '/' },
			{ label: $page.params.model, href: `/${$page.params.model}` },
			{ label: 'Info' },
			{ label: $page.params.id }
		]}
	/>

	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Info: {$page.params.id}</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Technical information and reference notes.
		</p>
	</div>

	<div class="mx-auto w-full max-w-5xl">
		{#if data.markdown}
			<InfoViewer markdown={data.markdown} />
		{:else}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
				No info document found for this ID.
			</div>
		{/if}
	</div>
</section>
