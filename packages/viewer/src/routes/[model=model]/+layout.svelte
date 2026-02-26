<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import type { ModelTree, TreeNode as TreeNodeType } from '@emdzej/wds-core';
	import TreeNode from '$lib/components/TreeNode.svelte';
	import { treeSearchQuery, selectedItem } from '$lib/stores/search';
	import { initFavorites } from '$lib/stores/favorites';
	import { initCollections } from '$lib/stores/collections';
	import { buildNameMaps } from '$lib/stores/tree';

	let { children, data } = $props<{
		children: () => unknown;
		data: { treePromise: Promise<ModelTree> };
	}>();

	let expandedIds = $state<string[]>([]);
	let loadedModelId: string | null = null;
	let searchQuery = $state('');
	let searchResults = $state<TreeNodeType[]>([]);
	let selectedResultIndex = $state(0);
	let treeData = $state<ModelTree | null>(null);
	let nodePathsMap = $state<Map<string, string>>(new Map());

	// Resizable panel
	let sidebarWidth = $state(320);
	let isResizing = $state(false);
	let containerRef: HTMLDivElement | null = null;

	const modelId = $derived($page.params.model ?? '');

	// Extract selected diagram/info ID from current route
	const selectedDiagramId = $derived.by(() => {
		const path = $page.url.pathname;
		const match = path.match(/\/diagram\/([^/]+)$/);
		return match?.[1] ?? null;
	});
	const selectedInfoId = $derived.by(() => {
		const path = $page.url.pathname;
		const match = path.match(/\/info\/([^/]+)$/);
		return match?.[1] ?? null;
	});

	const getStorageKey = (id: string) => `wds-viewer-tree:${id}`;
	const SIDEBAR_WIDTH_KEY = 'wds-viewer-sidebar-width';

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
		} catch {
			// Ignore localStorage errors (quota exceeded, etc.)
		}
	};

	// Load saved sidebar width
	$effect(() => {
		if (browser) {
			const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
			if (saved) {
				const width = parseInt(saved, 10);
				if (width >= 200 && width <= 600) {
					sidebarWidth = width;
				}
			}
		}
	});

	$effect(() => {
		if (browser && modelId && loadedModelId !== modelId) {
			loadedModelId = modelId;
			expandedIds = loadExpandedIds(modelId);
			initFavorites(modelId);
			initCollections(modelId);
		}
	});

	const expandedSet = $derived(new Set(expandedIds));

	const toggleNode = (id: string) => {
		if (expandedSet.has(id)) {
			expandedIds = expandedIds.filter((x) => x !== id);
		} else {
			expandedIds = [...expandedIds, id];
		}
		if (modelId) {
			persistExpandedIds(modelId, expandedIds);
		}
	};

	// Resize handlers
	const startResize = (e: MouseEvent) => {
		e.preventDefault();
		isResizing = true;
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', stopResize);
	};

	const handleResize = (e: MouseEvent) => {
		if (!isResizing || !containerRef) return;
		const containerRect = containerRef.getBoundingClientRect();
		const newWidth = e.clientX - containerRect.left;
		sidebarWidth = Math.max(200, Math.min(600, newWidth));
	};

	const stopResize = () => {
		isResizing = false;
		document.removeEventListener('mousemove', handleResize);
		document.removeEventListener('mouseup', stopResize);
		// Save width
		if (browser) {
			localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
		}
	};

	// Search functions
	const flattenTree = (
		node: TreeNodeType,
		acc: TreeNodeType[] = [],
		pathNames: string[] = []
	): TreeNodeType[] => {
		const currentPath = [...pathNames, node.name];
		if (node.type === 'leaf' && (node.diagram || node.info)) {
			acc.push(node);
			nodePathsMap.set(node.id, currentPath.join(' > '));
		}
		if (node.children) {
			for (const child of node.children) {
				flattenTree(child, acc, currentPath);
			}
		}
		return acc;
	};

	const searchTree = (query: string): TreeNodeType[] => {
		if (!treeData || !query.trim()) return [];
		const allLeaves = flattenTree(treeData.tree);
		const lowerQuery = query.toLowerCase();
		return allLeaves.filter((node) => node.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
	};

	const findPathToNode = (
		root: TreeNodeType,
		targetId: string,
		path: string[] = []
	): string[] | null => {
		if (root.id === targetId) return path;
		if (root.children) {
			for (const child of root.children) {
				const found = findPathToNode(child, targetId, [...path, root.id]);
				if (found) return found;
			}
		}
		return null;
	};

	// Find node by diagram or info id and return path to it
	const findNodeByItemId = (
		root: TreeNodeType,
		type: 'diagram' | 'info',
		itemId: string,
		path: string[] = []
	): { node: TreeNodeType; path: string[] } | null => {
		if (type === 'diagram' && root.diagram === itemId) {
			return { node: root, path };
		}
		if (type === 'info' && root.info === itemId) {
			return { node: root, path };
		}
		if (root.children) {
			for (const child of root.children) {
				const found = findNodeByItemId(child, type, itemId, [...path, root.id]);
				if (found) return found;
			}
		}
		return null;
	};

	// Expand tree to show a specific node
	const expandToItem = (type: 'diagram' | 'info', itemId: string) => {
		if (!treeData) return;
		const result = findNodeByItemId(treeData.tree, type, itemId);
		if (result) {
			const newExpanded = [...new Set([...expandedIds, ...result.path])];
			expandedIds = newExpanded;
			if (modelId) {
				persistExpandedIds(modelId, newExpanded);
			}
		}
	};

	const navigateToNode = (node: TreeNodeType) => {
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

		if (node.diagram) {
			void goto(resolve(`/${modelId}/diagram/${node.diagram}`));
		} else if (node.info) {
			void goto(resolve(`/${modelId}/info/${node.info}`));
		}

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

	// Load tree data
	$effect(() => {
		data.treePromise
			.then((tree: ModelTree) => {
				treeData = tree;
				buildNameMaps(tree.tree);
			})
			.catch(() => {});
	});

	// React to search from diagram clicks
	$effect(() => {
		const unsubscribe = treeSearchQuery.subscribe((query) => {
			if (query && treeData) {
				searchQuery = query;
				const results = searchTree(query);
				if (results.length === 1) {
					navigateToNode(results[0]);
					treeSearchQuery.set('');
				} else if (results.length > 1) {
					searchResults = results;
					selectedResultIndex = 0;
				} else {
					searchResults = [];
				}
			}
		});
		return unsubscribe;
	});

	// React to selected item from global search - expand tree to show it
	$effect(() => {
		const unsubscribe = selectedItem.subscribe((item) => {
			if (item && treeData) {
				expandToItem(item.type, item.id);
				selectedItem.set(null); // Clear after expanding
			}
		});
		return unsubscribe;
	});
</script>

<div
	bind:this={containerRef}
	class="flex h-[calc(100vh-10rem)] print:block print:h-auto"
	class:select-none={isResizing}
>
	<!-- Left panel: Search + Tree navigation -->
	<aside
		class="flex-shrink-0 overflow-hidden flex flex-col print:hidden"
		style="width: {sidebarWidth}px"
	>
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
			<svg
				class="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>

			<!-- Search results dropdown -->
			{#if searchResults.length > 0}
				<div
					class="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
				>
					<ul class="max-h-64 overflow-y-auto py-1">
						{#each searchResults as result, i (result.id)}
							<li>
								<button
									type="button"
									onclick={() => navigateToNode(result)}
									title={nodePathsMap.get(result.id) ?? result.name}
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition {i ===
									selectedResultIndex
										? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
										: 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'}"
								>
									{#if result.diagram}
										<svg
											viewBox="0 0 20 20"
											fill="currentColor"
											class="h-4 w-4 text-sky-500 flex-shrink-0"
										>
											<path
												d="M4.75 3.5A1.25 1.25 0 0 1 6 2.25h8A1.25 1.25 0 0 1 15.25 3.5v13A1.25 1.25 0 0 1 14 17.75H6A1.25 1.25 0 0 1 4.75 16.5v-13Z"
											/>
										</svg>
									{:else}
										<svg
											viewBox="0 0 20 20"
											fill="currentColor"
											class="h-4 w-4 text-emerald-500 flex-shrink-0"
										>
											<path d="M10 2.25a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Z" />
										</svg>
									{/if}
									<span>{result.name}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>

		<!-- Tree -->
		<div
			class="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
		>
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
						{selectedDiagramId}
						{selectedInfoId}
					/>
				</ul>
			{:catch error}
				<div class="p-4 text-sm text-red-500">
					Failed to load: {error instanceof Error ? error.message : 'Unknown error'}
				</div>
			{/await}
		</div>
	</aside>

	<!-- Resize handle -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
	<div
		class="w-2 flex-shrink-0 cursor-col-resize group flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors print:hidden"
		onmousedown={startResize}
		role="separator"
		aria-orientation="vertical"
		tabindex="0"
	>
		<div
			class="w-0.5 h-8 rounded-full bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-600 dark:group-hover:bg-slate-500 transition-colors"
		></div>
	</div>

	<!-- Right panel: Content viewer -->
	<main class="flex-1 min-w-0 overflow-hidden pl-4">
		{@render children()}
	</main>
</div>
