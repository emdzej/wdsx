<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ModelTree } from '@emdzej/wds-core';
	import TreeNode from '$lib/components/TreeNode.svelte';

	let { data } = $props<{ data: { treePromise: Promise<ModelTree> } }>();

	let expandedIds = new SvelteSet<string>();
	let loadedModelId: string | null = null;
	let mobileTreeOpen = $state(false);

	const modelId = $derived($page.params.model ?? '');

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

	$effect(() => {
		if (browser && modelId && loadedModelId !== modelId) {
			loadedModelId = modelId;
			expandedIds = new SvelteSet(loadExpandedIds(modelId));
		}
	});

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
			class="rounded-2xl border border-dashed border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
		>
			<div class="space-y-4">
				<div class="skeleton-line w-32"></div>
				<div class="skeleton-line h-6 w-48"></div>
				<div class="space-y-2">
					<div class="skeleton-line"></div>
					<div class="skeleton-line w-11/12"></div>
					<div class="skeleton-line w-5/6"></div>
				</div>
			</div>
		</div>
	{:then modelTree}
		<div
			class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
		>
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
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
				<p class="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
					Updated {modelTree.generated}
				</p>
				<button
					onclick={() => (mobileTreeOpen = true)}
					class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 md:hidden"
					type="button"
				>
					Browse tree
				</button>
			</div>

			<div class="hidden md:block">
				<ul class="space-y-1">
					<TreeNode node={modelTree.tree} {modelId} {expandedIds} onToggle={toggleNode} />
				</ul>
			</div>

			<p class="mt-4 text-xs text-slate-500 dark:text-slate-400 md:hidden">
				Updated {modelTree.generated}
			</p>
		</div>

		{#if mobileTreeOpen}
			<button
				type="button"
				class="fixed inset-0 z-40 bg-slate-900/40 md:hidden wds-no-print"
				onclick={() => (mobileTreeOpen = false)}
				aria-label="Close tree"
			></button>
			<div
				class="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:hidden wds-no-print"
			>
				<div
					class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800"
				>
					<div>
						<p
							class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
						>
							{modelTree.model}
						</p>
						<h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Model tree</h3>
					</div>
					<button
						type="button"
						onclick={() => (mobileTreeOpen = false)}
						class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:text-slate-900 dark:border-slate-800 dark:text-slate-300"
					>
						Close
					</button>
				</div>
				<div class="max-h-[calc(80vh-3.5rem)] overflow-y-auto px-3 py-4">
					<ul class="space-y-1">
						<TreeNode node={modelTree.tree} {modelId} {expandedIds} onToggle={toggleNode} />
					</ul>
				</div>
			</div>
		{/if}
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
