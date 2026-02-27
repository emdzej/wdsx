<script lang="ts">
	import type { ModelMeta } from '@emdzej/wds-core';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import HistoryDropdown from './HistoryDropdown.svelte';
	import FavoritesDropdown from './FavoritesDropdown.svelte';
	import CollectionsDropdown from './CollectionsDropdown.svelte';
	import SettingsDropdown from './SettingsDropdown.svelte';

	let {
		models = [],
		selectedModelId = $bindable(''),
		onToggleSidebar
	} = $props<{
		models?: ModelMeta[];
		selectedModelId?: string;
		onToggleSidebar?: () => void;
	}>();

	const handleModelChange = (e: Event) => {
		const select = e.target as HTMLSelectElement;
		const newModelId = select.value;
		if (newModelId && newModelId !== selectedModelId) {
			selectedModelId = newModelId;
			void goto(resolve(`/${newModelId}`));
		}
	};
</script>

<header
	class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
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
				<a
					href={resolve('/')}
					class="text-lg font-semibold text-slate-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
				>
					Wiring Diagram System
				</a>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<label class="text-sm font-medium text-slate-500 dark:text-slate-400" for="model-select">
				Model
			</label>
			<select
				id="model-select"
				class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/40"
				bind:value={selectedModelId}
				onchange={handleModelChange}
			>
				{#if models.length === 0}
					<option value="" disabled>Loading models…</option>
				{:else}
					{#each models as model (model.id)}
						<option value={model.id}>{model.name}</option>
					{/each}
				{/if}
			</select>
			<HistoryDropdown />
			<FavoritesDropdown />
			<CollectionsDropdown />
			<SettingsDropdown />
		</div>
	</div>
</header>
