<script lang="ts">
	import { browser } from '$app/environment';
	import { createEventDispatcher, onMount } from 'svelte';
	import TreeNode from '$lib/components/TreeNode.svelte';
	import type { ModelTreeNode } from '$lib/utils/data-loader';

	export let tree: ModelTreeNode;
	export let modelId: string;

	const dispatch = createEventDispatcher<{ navigate: void }>();
	let expandedIds = new Set<string>();
	let ready = false;

	const storageKey = () => `wds-viewer-tree:${modelId}`;

	onMount(() => {
		if (!browser) return;
		const stored = localStorage.getItem(storageKey());
		if (stored) {
			try {
				expandedIds = new Set<string>(JSON.parse(stored));
			} catch {
				expandedIds = new Set<string>();
			}
		}

		if (tree?.id && expandedIds.size === 0) {
			expandedIds.add(tree.id);
		}
		ready = true;
	});

	$: if (browser && ready) {
		localStorage.setItem(storageKey(), JSON.stringify(Array.from(expandedIds)));
	}

	function handleToggle(event: CustomEvent<{ id: string }>) {
		const { id } = event.detail;
		if (expandedIds.has(id)) {
			expandedIds.delete(id);
		} else {
			expandedIds.add(id);
		}
		expandedIds = new Set(expandedIds);
	}

	function handleNavigate() {
		dispatch('navigate');
	}
</script>

<nav class="space-y-3">
	<div class="flex items-center justify-between">
		<h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400">Tree</h2>
		<span class="text-xs text-slate-400">{tree?.name}</span>
	</div>
	<ul class="space-y-1">
		{#if tree}
			<TreeNode
				node={tree}
				{expandedIds}
				depth={0}
				{modelId}
				on:toggle={handleToggle}
				on:navigate={handleNavigate}
			/>
		{:else}
			<li class="text-xs text-slate-400">No tree data.</li>
		{/if}
	</ul>
</nav>
