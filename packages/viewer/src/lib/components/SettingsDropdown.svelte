<script lang="ts">
	import { exportAllFavorites, importFavorites, type FavoritesExport } from '$lib/stores/favorites';
	import {
		exportAllCollections,
		importCollections,
		type CollectionsExport
	} from '$lib/stores/collections';
	import { theme, toggleTheme } from '$lib/stores/theme';

	let isOpen = $state(false);
	let fileInput: HTMLInputElement;
	let importMessage = $state<string | null>(null);

	const handleExportFavorites = () => {
		const data = exportAllFavorites();
		downloadJson(data, 'wdsx-favorites');
		isOpen = false;
	};

	const handleExportCollections = () => {
		const data = exportAllCollections();
		downloadJson(data, 'wdsx-collections');
		isOpen = false;
	};

	const downloadJson = (data: object, prefix: string) => {
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleImportClick = () => {
		fileInput?.click();
	};

	const handleFileChange = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			if (data.app !== 'wdsx') {
				importMessage = 'Invalid file format';
				setTimeout(() => (importMessage = null), 3000);
				return;
			}

			if (data.type === 'collections' && data.collections) {
				const result = importCollections(data as CollectionsExport, 'merge');
				importMessage = `Imported ${result.imported} collections from ${result.models} models`;
			} else if (data.favorites) {
				const result = importFavorites(data as FavoritesExport, 'merge');
				importMessage = `Imported ${result.imported} favorites from ${result.models} models`;
			} else {
				importMessage = 'Unknown file type';
			}

			setTimeout(() => {
				importMessage = null;
				isOpen = false;
			}, 2000);
		} catch {
			importMessage = 'Failed to parse file';
			setTimeout(() => (importMessage = null), 3000);
		}

		input.value = '';
	};

	const handleClickOutside = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.settings-dropdown')) {
			isOpen = false;
		}
	};
</script>

<svelte:window onclick={handleClickOutside} />

<div class="settings-dropdown relative">
	<button
		type="button"
		class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
		onclick={() => (isOpen = !isOpen)}
		aria-label="Settings"
		title="Settings"
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
			<circle cx="12" cy="12" r="3" />
			<path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
			/>
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
		>
			<div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
				<h3 class="font-semibold text-slate-900 dark:text-white">Settings</h3>
			</div>

			<div class="p-2">
				<!-- Appearance -->
				<p class="px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
					Appearance
				</p>

				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
					onclick={toggleTheme}
				>
					{#if $theme === 'dark'}
						<span class="text-base">🌙</span>
						<span>Dark Mode</span>
						<span class="ml-auto text-xs text-slate-400">On</span>
					{:else}
						<span class="text-base">☀️</span>
						<span>Light Mode</span>
						<span class="ml-auto text-xs text-slate-400">On</span>
					{/if}
				</button>

				<!-- Favorites -->
				<p class="mt-3 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
					Favorites
				</p>

				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
					onclick={handleExportFavorites}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-4 w-4"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Export Favorites
				</button>

				<!-- Collections -->
				<p class="mt-3 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
					Collections
				</p>

				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
					onclick={handleExportCollections}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-4 w-4"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Export Collections
				</button>

				<!-- Import -->
				<p class="mt-3 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
					Import
				</p>

				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
					onclick={handleImportClick}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-4 w-4"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
					Import (Favorites or Collections)
				</button>

				{#if importMessage}
					<p class="mt-2 px-3 text-xs text-emerald-600 dark:text-emerald-400">{importMessage}</p>
				{/if}
			</div>
		</div>
	{/if}

	<input
		type="file"
		accept=".json,application/json"
		class="hidden"
		bind:this={fileInput}
		onchange={handleFileChange}
	/>
</div>
