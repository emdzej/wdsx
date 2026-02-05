<script lang="ts">
	import { navigating } from '$app/stores';
	import ModelCard from '$lib/components/ModelCard.svelte';
	import ModelCardSkeleton from '$lib/components/ModelCardSkeleton.svelte';
	import type { ModelIndexEntry } from '$lib/utils/data-loader';

	let { data } = $props<{
		models: ModelIndexEntry[];
	}>();

	const skeletons = Array.from({ length: 6 });
</script>

<section class="space-y-4">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Select a model</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Choose a BMW platform to explore wiring diagrams and service information.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#if $navigating}
			{#each skeletons as _}
				<ModelCardSkeleton />
			{/each}
		{:else}
			{#each data.models as model}
				<ModelCard {model} />
			{/each}
		{/if}
	</div>
</section>
