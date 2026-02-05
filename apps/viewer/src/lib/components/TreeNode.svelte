<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ModelTreeNode } from '$lib/utils/data-loader';

	export let node: ModelTreeNode;
	export let expandedIds: Set<string>;
	export let depth = 0;
	export let modelId: string;

	const dispatch = createEventDispatcher<{ toggle: { id: string } }>();

	$: isFolder = node.type === 'folder' || (node.children?.length ?? 0) > 0;
	$: isExpanded = expandedIds.has(node.id);
	$: diagramId = node.diagram ?? node.diagramId;
	$: infoId = node.info ?? node.infoId;

	const indent = (level: number) => `${level * 14}px`;

	function toggle() {
		dispatch('toggle', { id: node.id });
	}

	function openDiagram() {
		if (!diagramId) return;
		goto(`/${modelId}/diagram/${diagramId}`);
	}

	function openInfo() {
		if (!infoId) return;
		goto(`/${modelId}/info/${infoId}`);
	}

	function openPrimary() {
		if (diagramId) return openDiagram();
		if (infoId) return openInfo();
	}
</script>

<li>
	<div
		class="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
		style={`padding-left: ${indent(depth)};`}
	>
		{#if isFolder}
			<button
				class="flex w-full items-center gap-2 text-left"
				on:click|stopPropagation={toggle}
				type="button"
				aria-expanded={isExpanded}
			>
				<span class="inline-flex h-5 w-5 items-center justify-center text-slate-500 dark:text-slate-400">
					{#if isExpanded}
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M4 6h6l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M4 6h6l2 2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
						</svg>
					{/if}
				</span>
				<span class="font-medium">{node.name}</span>
				<span class="ml-auto text-xs text-slate-400">{isExpanded ? '–' : '+'}</span>
			</button>
		{:else}
			<div class="flex items-center gap-2">
				<button class="flex flex-1 items-center gap-2 text-left" on:click={openPrimary} type="button">
					<span class="inline-flex h-5 w-5 items-center justify-center text-slate-400">
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6z" />
							<path d="M14 2v6h6" />
						</svg>
					</span>
					<span>{node.name}</span>
				</button>
				<div class="flex items-center gap-1">
					{#if diagramId}
						<button
							class="rounded-md p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
							on:click|stopPropagation={openDiagram}
							title="Open diagram"
							type="button"
						>
							<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					{/if}
					{#if infoId}
						<button
							class="rounded-md p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
							on:click|stopPropagation={openInfo}
							title="Open info"
							type="button"
						>
							<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="9" />
								<path d="M12 16v-4" />
								<path d="M12 8h.01" />
							</svg>
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if isFolder && isExpanded}
		<ul class="mt-1 space-y-1">
			{#each node.children ?? [] as child}
				<svelte:self
					node={child}
					{expandedIds}
					depth={depth + 1}
					{modelId}
					on:toggle
				/>
			{/each}
		</ul>
	{/if}
</li>
