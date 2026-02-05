<script lang="ts">
	import type { ModelIndexEntry } from '$lib/utils/data-loader';

	export let model: ModelIndexEntry;

	let stats = [] as { label: string; value: number }[];

	$: stats = [
		{ label: 'Diagrams', value: model.diagramCount },
		{ label: 'Info docs', value: model.infoCount }
	];
</script>

<a
	href={`/${model.id}/`}
	class="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
	data-sveltekit-preload-data="hover"
>
	<div class="flex items-center gap-4">
		<div
			class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-lg font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
		>
			{#if model.icon}
				<img src={model.icon} alt={`${model.name} icon`} class="h-full w-full object-cover" />
			{:else}
				{model.name}
			{/if}
		</div>
		<div>
			<div class="text-xs uppercase tracking-[0.2em] text-slate-400">Model</div>
			<div class="text-xl font-semibold text-slate-900 dark:text-white">{model.name}</div>
			<div class="text-sm text-slate-500 dark:text-slate-400">ID: {model.id}</div>
		</div>
	</div>
	<div class="grid grid-cols-2 gap-3 text-sm">
		{#each stats as stat}
			<div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950">
				<div class="text-lg font-semibold text-slate-800 dark:text-slate-100">
					{stat.value}
				</div>
				<div class="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
			</div>
		{/each}
	</div>
	<div class="mt-auto flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
		Open model
		<span class="transition group-hover:translate-x-1">→</span>
	</div>
</a>
