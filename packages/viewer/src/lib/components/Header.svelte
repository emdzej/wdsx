<script lang="ts">
	import type { ModelMeta } from '@emdzej/wds-core';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import DarkModeToggle from './DarkModeToggle.svelte';
	import SearchInput from './SearchInput.svelte';

	let {
		models = [],
		selectedModelId = $bindable(''),
		onToggleSidebar
	} = $props<{
		models?: ModelMeta[];
		selectedModelId?: string;
		onToggleSidebar?: () => void;
	}>();

	const pageQuery = $derived(
		browser ? $page.url.searchParams.get('q') ?? '' : ''
	);

	const toPathname = (path: string) => path as App.Pathname;

	const handleSearch = (query: string) => {
		const trimmed = query.trim();
		const target = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search';
		void goto(resolve(toPathname(target)));
	};
</script>

<header
	class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
>
	<div class="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white md:hidden"
				onclick={onToggleSidebar}
				aria-label="Toggle navigation"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-5 w-5"
				>
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-slate-400">WDS Viewer</p>
				<h1 class="text-lg font-semibold text-slate-900 dark:text-white">Wiring Diagram System</h1>
			</div>
		</div>
		<div class="flex flex-1 flex-wrap items-center justify-end gap-3">
			<SearchInput
				class="w-full md:w-64 lg:w-80"
				value={pageQuery}
				placeholder="Search diagrams & info…"
				onSearch={handleSearch}
			/>
			<label class="text-sm font-medium text-slate-500 dark:text-slate-400" for="model-select">
				Model
			</label>
			<select
				id="model-select"
				class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/40"
				bind:value={selectedModelId}
			>
				{#if models.length === 0}
					<option value="" disabled>Loading models…</option>
				{:else}
					{#each models as model (model.id)}
						<option value={model.id}>{model.name}</option>
					{/each}
				{/if}
			</select>
			<DarkModeToggle />
		</div>
	</div>
</header>
