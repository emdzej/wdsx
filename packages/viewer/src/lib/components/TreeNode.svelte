<script lang="ts">
	import type { TreeNode as TreeNodeType } from '@emdzej/wds-core';
	import { resolve } from '$app/paths';

	export let node: TreeNodeType;
	export let modelId: string;
	export let expandedIds: Set<string>;
	export let onToggle: (id: string) => void;
	export let depth = 0;

	const isFolder = (node: TreeNodeType) => node.type === 'folder';
	const hasChildren = (node: TreeNodeType) => (node.children?.length ?? 0) > 0;

	$: expanded = expandedIds.has(node.id);
	$: indent = `${depth * 1.25}rem`;

	$: hasDiagram = Boolean(node.diagram);
	$: hasInfo = Boolean(node.info);
	$: hasLink = hasDiagram || hasInfo;
</script>

<li class="select-none">
	{#if isFolder(node)}
		<button
			type="button"
			class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900"
			style={`padding-left: ${indent}`}
			aria-expanded={expanded}
			onclick={() => onToggle(node.id)}
		>
			<span
				class={`flex h-4 w-4 items-center justify-center text-slate-400 transition-transform ${
					expanded ? 'rotate-90 text-slate-600 dark:text-slate-300' : ''
				}`}
				aria-hidden="true"
			>
				<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
					<path
						d="M6 4.75a.75.75 0 0 1 1.2-.6l6 5.25a.75.75 0 0 1 0 1.2l-6 5.25a.75.75 0 0 1-1.2-.6v-10.5Z"
					/>
				</svg>
			</span>
			<span class="flex h-5 w-5 items-center justify-center text-amber-500" aria-hidden="true">
				<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
					<path
						d="M2.75 5.5A2.75 2.75 0 0 1 5.5 2.75h3.379a2.75 2.75 0 0 1 1.944.805l1.122 1.122c.326.326.768.51 1.228.51H14.5A2.75 2.75 0 0 1 17.25 7.5v6.25A2.75 2.75 0 0 1 14.5 16.5h-9A2.75 2.75 0 0 1 2.75 13.75V5.5Z"
					/>
				</svg>
			</span>
			<span class="truncate">{node.name}</span>
		</button>

		{#if expanded && hasChildren(node)}
			<ul class="mt-1 space-y-1">
				{#each node.children ?? [] as child (child.id)}
					<svelte:self node={child} {modelId} {expandedIds} {onToggle} depth={depth + 1} />
				{/each}
			</ul>
		{/if}
	{:else if hasLink}
		{#if hasDiagram}
			<a
				href={resolve(`/${modelId}/diagram/${node.diagram}`)}
				class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
				style={`padding-left: ${indent}`}
			>
				<span class="flex h-5 w-5 items-center justify-center" aria-hidden="true">
					<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-sky-500">
						<path
							d="M4.75 3.5A1.25 1.25 0 0 1 6 2.25h8A1.25 1.25 0 0 1 15.25 3.5v13A1.25 1.25 0 0 1 14 17.75H6A1.25 1.25 0 0 1 4.75 16.5v-13Zm2.5 1.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"
						/>
					</svg>
				</span>
				<span class="truncate">{node.name}</span>
			</a>
		{:else}
			<a
				href={resolve(`/${modelId}/info/${node.info}`)}
				class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
				style={`padding-left: ${indent}`}
			>
				<span class="flex h-5 w-5 items-center justify-center" aria-hidden="true">
					<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-emerald-500">
						<path
							d="M10 2.25a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Zm.75 5a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1a.75.75 0 0 1 .75.75Zm-2 3a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-3.25h-.5a.75.75 0 0 1-.75-.75Z"
						/>
					</svg>
				</span>
				<span class="truncate">{node.name}</span>
			</a>
		{/if}
	{:else}
		<div
			class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400"
			style={`padding-left: ${indent}`}
		>
			<span class="flex h-5 w-5 items-center justify-center" aria-hidden="true">
				<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-slate-400">
					<path
						d="M6.75 2.25A2.75 2.75 0 0 0 4 5v10a2.75 2.75 0 0 0 2.75 2.75h6.5A2.75 2.75 0 0 0 16 15V8.5a2.75 2.75 0 0 0-.805-1.944l-2.751-2.75A2.75 2.75 0 0 0 10.5 3.5H6.75Z"
					/>
				</svg>
			</span>
			<span class="truncate">{node.name}</span>
		</div>
	{/if}
</li>
