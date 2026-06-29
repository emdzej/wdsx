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
			<div class="flex items-baseline gap-2">
				<a
					href={resolve('/')}
					class="text-lg font-semibold tracking-tight text-slate-900 transition hover:opacity-80 dark:text-white"
				>
					WDS<span class="text-sky-500 dark:text-sky-400">X</span>
				</a>
				<a
					href={`https://github.com/emdzej/wdsx/releases/tag/${__APP_VERSION__}`}
					target="_blank"
					rel="noopener noreferrer"
					class="text-xs text-slate-400 underline-offset-2 transition hover:text-slate-700 hover:underline dark:text-slate-500 dark:hover:text-slate-200 tabular-nums"
					title="View release on GitHub"
				>
					{__APP_VERSION__}
				</a>
				<a
					href="https://github.com/emdzej/wdsx"
					target="_blank"
					rel="noopener noreferrer"
					class="self-center text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
					title="wdsx on GitHub"
					aria-label="wdsx on GitHub"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						width="16"
						height="16"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
						/>
					</svg>
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
