<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { loadModelsIndex } from '$lib/data/loaders';
	import type { ModelMeta } from '@emdzej/wds-core';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

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

<div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<div class="flex min-h-screen">
		<div class="wds-no-print">
			<Sidebar open={sidebarOpen} onClose={() => (sidebarOpen = false)} />
		</div>
		<div class="flex min-h-screen flex-1 flex-col">
			<div class="wds-no-print">
				<Header
					{models}
					bind:selectedModelId
					onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
				/>
			</div>
			<main class="flex-1 px-4 py-6 md:px-8">
				<div class="wds-no-print">
					<Breadcrumbs />
				</div>
				<div class="mt-6">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>
