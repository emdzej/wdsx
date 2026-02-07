<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ModelTree } from '@emdzej/wds-core';
	import TreeNode from '$lib/components/TreeNode.svelte';

	export let data: { treePromise: Promise<ModelTree> };

	let expandedIds = new SvelteSet<string>();
	let loadedModelId: string | null = null;

	$: modelId = $page.params.model ?? '';

	const getStorageKey = (id: string) => `wds-viewer-tree:${id}`;

	const loadExpandedIds = (id: string) => {
		if (!browser) {
			return [] as string[];
		}

		try {
			const stored = localStorage.getItem(getStorageKey(id));
			return stored ? (JSON.parse(stored) as string[]) : [];
		} catch (error) {
			console.warn('Failed to read tree state', error);
			return [] as string[];
		}
	};

	const persistExpandedIds = (id: string, ids: Set<string>) => {
		if (!browser) {
			return;
		}

		try {
			localStorage.setItem(getStorageKey(id), JSON.stringify([...ids]));
		} catch (error) {
			console.warn('Failed to persist tree state', error);
		}
	};

	$: if (browser && modelId && loadedModelId !== modelId) {
		loadedModelId = modelId;
		expandedIds = new SvelteSet(loadExpandedIds(modelId));
	}

	const toggleNode = (id: string) => {
		if (expandedIds.has(id)) {
			expandedIds.delete(id);
		} else {
			expandedIds.add(id);
		}

		if (!modelId) {
			return;
		}

		persistExpandedIds(modelId, expandedIds);
	};
</script>

<section class="space-y-6">
	<div>
		<p class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
			Model tree
		</p>
		<h1 class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{modelId}</h1>
		<p class="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
			Browse folders, wiring diagrams, and information pages for this model.
		</p>
	</div>

	{#await data.treePromise}
		<div
			class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
		>
			Loading tree…
		</div>
	{:then modelTree}
		<div
			class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
		>
			<div class="mb-4 flex items-center justify-between">
				<div>
					<p
						class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
					>
						{modelTree.model}
					</p>
					<h2 class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
						Navigation tree
					</h2>
				</div>
				<p class="text-xs text-slate-500 dark:text-slate-400">
					Updated {modelTree.generated}
				</p>
			</div>

			<ul class="space-y-1">
				<TreeNode node={modelTree.tree} {modelId} {expandedIds} onToggle={toggleNode} />
			</ul>
		</div>
	{:catch error}
		<div
			class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
		>
			<p class="font-semibold">Failed to load tree</p>
			<p class="mt-2 text-sm opacity-80">
				{error instanceof Error ? error.message : 'Unknown error'}
			</p>
		</div>
	{/await}
</section>
