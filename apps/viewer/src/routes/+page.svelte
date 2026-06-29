<script lang="ts">
	import type { ModelsIndex } from '@emdzej/wds-core';
	import ModelCard from '$lib/components/ModelCard.svelte';

	export let data: { modelsPromise: Promise<ModelsIndex> };
</script>

<section class="space-y-6">
	<div>
		<p class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
			Model selection
		</p>
		<h1 class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Choose a model</h1>
		<p class="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
			Pick a BMW model to explore wiring diagrams and technical information.
		</p>
	</div>

	{#await data.modelsPromise}
		<div
			class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
		>
			Loading models…
		</div>
	{:then modelsIndex}
		{#if modelsIndex.models.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
			>
				No models have been imported yet. Run the importer to generate data.
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each modelsIndex.models as model (model.id)}
					<ModelCard {model} />
				{/each}
			</div>
		{/if}
	{:catch error}
		<div
			class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
		>
			<p class="font-semibold">Failed to load models</p>
			<p class="mt-2 text-sm opacity-80">
				{error instanceof Error ? error.message : 'Unknown error'}
			</p>
		</div>
	{/await}
</section>
