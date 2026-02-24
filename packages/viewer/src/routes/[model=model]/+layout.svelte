<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import type { ModelTree, TreeNode as TreeNodeType } from '@emdzej/wds-core';
	import TreeNode from '$lib/components/TreeNode.svelte';

	let { children, data } = $props<{ 
		children: () => unknown;
		data: { treePromise: Promise<ModelTree> } 
	}>();

	let expandedIds = $state<string[]>([]);
	let loadedModelId: string | null = null;
	let searchQuery = $state('');
	let searchResults = $state<TreeNodeType[]>([]);
	let selectedResultIndex = $state(0);
	let treeData = $state<ModelTree | null>(null);

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

	// Search functions
	const flattenTree = (node: TreeNodeType, acc: TreeNodeType[] = []): TreeNodeType[] => {
		// Only add leaf nodes (with diagram or info)
		if (node.type === 'leaf' && (node.diagram || node.info)) {
			acc.push(node);
		}
		if (node.children) {
			for (const child of node.children) {
				flattenTree(child, acc);
			}
		}
		return acc;
	};

	const searchTree = (query: string): TreeNodeType[] => {
		if (!treeData || !query.trim()) return [];
		const allLeaves = flattenTree(treeData.tree);
		const lowerQuery = query.toLowerCase();
		return allLeaves
			.filter(node => node.name.toLowerCase().includes(lowerQuery))
			.slice(0, 10); // Limit results
	};

	// Find path to node for expanding parents
	const findPathToNode = (root: TreeNodeType, targetId: string, path: string[] = []): string[] | null => {
		if (root.id === targetId) return path;
		if (root.children) {
			for (const child of root.children) {
				const found = findPathToNode(child, targetId, [...path, root.id]);
				if (found) return found;
			}
		}
		return null;
	};

	const navigateToNode = (node: TreeNodeType) => {
		// Expand all parent folders
		if (treeData) {
			const path = findPathToNode(treeData.tree, node.id);
			if (path) {
				const newExpanded = [...new Set([...expandedIds, ...path])];
				expandedIds = newExpanded;
				if (modelId) {
					persistExpandedIds(modelId, newExpanded);
				}
			}
		}
		
		// Navigate to the node
		if (node.diagram) {
			void goto(resolve(`/${modelId}/diagram/${node.diagram}`));
		} else if (node.info) {
			void goto(resolve(`/${modelId}/info/${node.info}`));
		}
		
		// Clear search
		searchQuery = '';
		searchResults = [];
	};

	const handleSearchInput = () => {
		searchResults = searchTree(searchQuery);
		selectedResultIndex = 0;
	};

	const handleSearchKeydown = (e: KeyboardEvent) => {
		if (!searchResults.length) return;
		
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedResultIndex = Math.min(selectedResultIndex + 1, searchResults.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedResultIndex = Math.max(selectedResultIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const selected = searchResults[selectedResultIndex];
			if (selected) navigateToNode(selected);
		} else if (e.key === 'Escape') {
			searchQuery = '';
			searchResults = [];
		}
	};

	// Load tree data for search
	$effect(() => {
		data.treePromise.then(tree => {
			treeData = tree;
		}).catch(() => {});
	});
</script>

<div class="flex gap-6 h-[calc(100vh-10rem)]">
	<!-- Left panel: Search + Tree navigation -->
	<aside class="w-80 flex-shrink-0 overflow-hidden flex flex-col">
		<div class="mb-3">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				{modelId}
			</p>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Navigation</h2>
		</div>
		
		<!-- Search input -->
		<div class="relative mb-3">
			<input
				type="text"
				bind:value={searchQuery}
				oninput={handleSearchInput}
				onkeydown={handleSearchKeydown}
				placeholder="Search diagrams & info..."
				class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm placeholder-slate-400 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
			/>
			<svg class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			
			<!-- Search results dropdown -->
			{#if searchResults.length > 0}
				<div class="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
					<ul class="max-h-64 overflow-y-auto py-1">
						{#each searchResults as result, i (result.id)}
							<li>
								<button
									type="button"
									onclick={() => navigateToNode(result)}
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition {i === selectedResultIndex ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'}"
								>
									{#if result.diagram}
										<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-sky-500 flex-shrink-0">
											<path d="M4.75 3.5A1.25 1.25 0 0 1 6 2.25h8A1.25 1.25 0 0 1 15.25 3.5v13A1.25 1.25 0 0 1 14 17.75H6A1.25 1.25 0 0 1 4.75 16.5v-13Z" />
										</svg>
									{:else}
										<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-emerald-500 flex-shrink-0">
											<path d="M10 2.25a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Z" />
										</svg>
									{/if}
									<span class="truncate">{result.name}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		
		<!-- Tree -->
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
