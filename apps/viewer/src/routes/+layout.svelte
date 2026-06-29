<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { loadModelsIndex } from '$lib/data/loaders';
	import type { ModelMeta } from '@emdzej/wds-core';
	import Header from '$lib/components/Header.svelte';
	import { initTheme } from '$lib/stores/theme';

	let { children } = $props<{ children: () => unknown }>();

	let sidebarOpen = $state(false);
	let models = $state<ModelMeta[]>([]);
	let selectedModelId = $state('');

	$effect(() => {
		if (!selectedModelId && models.length > 0) {
			selectedModelId = models[0]?.id ?? '';
		}
	});

	onMount(async () => {
		initTheme();
		try {
			const modelsIndex = await loadModelsIndex(fetch);
			models = modelsIndex.models;
		} catch (error) {
			console.warn('Failed to load models index', error);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 print:bg-white"
>
	<div class="flex min-h-screen print:block">
		<div class="flex min-h-screen flex-1 flex-col print:block print:min-h-0">
			<div class="print:hidden">
				<Header
					{models}
					bind:selectedModelId
					onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
				/>
			</div>
			<main class="flex-1 px-4 py-6 md:px-8 print:p-0">
				<div class="print:mt-0">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>
