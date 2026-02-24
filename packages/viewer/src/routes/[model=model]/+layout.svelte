<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type { ModelTree } from '@emdzej/wds-core';
	import TreeNode from '$lib/components/TreeNode.svelte';

	let { children, data } = $props<{ 
		children: () => unknown;
		data: { treePromise: Promise<ModelTree> } 
	}>();

	// Use $state for reactivity instead of SvelteSet
	let expandedIds = $state<string[]>([]);
	let loadedModelId: string | null = null;

	const modelId = $derived($page.params.model ?? '');

	const getStorageKey = (id: string) => `wds-viewer-tree:${id}`;

	const loadExpandedIds = (id: string): string[] => {
		if (!browser) return [];
		try {
			const stored = localStorage.getItem(getStorageKey(id));
			return stored ? (JSON.parse(stored) as string[]) : [];
		} catch {
			return [];
		}
	};

	const persistExpandedIds = (id: string, ids: string[]) => {
		if (!browser) return;
		try {
			localStorage.setItem(getStorageKey(id), JSON.stringify(ids));
		} catch {}
	};

	$effect(() => {
		if (browser && modelId && loadedModelId !== modelId) {
			loadedModelId = modelId;
			expandedIds = loadExpandedIds(modelId);
		}
	});

	// Convert to Set for lookup, but keep array as source of truth
	const expandedSet = $derived(new Set(expandedIds));

	const toggleNode = (id: string) => {
		if (expandedSet.has(id)) {
			expandedIds = expandedIds.filter(x => x !== id);
		} else {
			expandedIds = [...expandedIds, id];
		}
		if (modelId) {
			persistExpandedIds(modelId, expandedIds);
		}
	};
</script>

<div class="flex gap-6 h-[calc(100vh-10rem)]">
	<!-- Left panel: Tree navigation (fixed width) -->
	<aside class="w-80 flex-shrink-0 overflow-hidden flex flex-col">
		<div class="mb-3">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				{modelId}
			</p>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Navigation</h2>
		</div>
		
		<div class="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
			{#await data.treePromise}
				<div class="space-y-2 p-2">
					<div class="skeleton-line w-32"></div>
					<div class="skeleton-line w-48"></div>
					<div class="skeleton-line w-40"></div>
				</div>
			{:then modelTree}
				<ul class="space-y-1">
					<TreeNode 
						node={modelTree.tree} 
						{modelId} 
						expandedIds={expandedSet} 
						onToggle={toggleNode} 
					/>
				</ul>
			{:catch error}
				<div class="p-4 text-sm text-red-500">
					Failed to load: {error instanceof Error ? error.message : 'Unknown error'}
				</div>
			{/await}
		</div>
	</aside>

	<!-- Right panel: Content viewer -->
	<main class="flex-1 min-w-0 overflow-hidden">
		{@render children()}
	</main>
</div>
