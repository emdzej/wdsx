<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { favorites, removeFavorite, currentModelId } from '$lib/stores/favorites';
	import { selectedItem } from '$lib/stores/search';

	let isOpen = $state(false);
	let searchQuery = $state('');
	let dropdownRef: HTMLDivElement | null = null;

	const modelId = $derived($currentModelId);
	const allFavorites = $derived($favorites);
	
	const filteredFavorites = $derived(() => {
		if (!searchQuery.trim()) return allFavorites;
		const query = searchQuery.toLowerCase();
		return allFavorites.filter((item) => 
			item.name.toLowerCase().includes(query) || 
			item.id.toLowerCase().includes(query)
		);
	});

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	};

	const navigateToItem = (item: { type: 'diagram' | 'info'; id: string }) => {
		selectedItem.set({ type: item.type, id: item.id });
		const path = item.type === 'diagram' 
			? `/${modelId}/diagram/${item.id}`
			: `/${modelId}/info/${item.id}`;
		void goto(resolve(path as `/${string}`));
		isOpen = false;
		searchQuery = '';
	};

	const handleRemove = (event: MouseEvent, type: 'diagram' | 'info', id: string) => {
		event.stopPropagation();
		removeFavorite(type, id);
	};

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if modelId}
	<div bind:this={dropdownRef} class="relative">
		<button
			type="button"
			onclick={() => (isOpen = !isOpen)}
			class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
			title="Favorites"
		>
			<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
			</svg>
			<span class="hidden sm:inline">Favorites</span>
			{#if allFavorites.length > 0}
				<span class="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
					{allFavorites.length}
				</span>
			{/if}
		</button>

		{#if isOpen}
			<div
				class="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
			>
				<div class="border-b border-slate-200 p-3 dark:border-slate-700">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search favorites..."
						class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
					/>
				</div>

				<div class="max-h-80 overflow-y-auto">
					{#if filteredFavorites().length === 0}
						<div class="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
							{#if allFavorites.length === 0}
								<svg class="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" viewBox="0 0 20 20" fill="currentColor">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								No favorites yet.<br/>
								<span class="text-xs">Click ★ on diagrams or info pages to add.</span>
							{:else}
								No matches found.
							{/if}
						</div>
					{:else}
						<ul class="py-1">
							{#each filteredFavorites() as item (item.type + ':' + item.id)}
								<li>
									<button
										type="button"
										onclick={() => navigateToItem(item)}
										class="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
									>
										{#if item.type === 'diagram'}
											<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 flex-shrink-0 text-sky-500">
												<path d="M4.75 3.5A1.25 1.25 0 0 1 6 2.25h8A1.25 1.25 0 0 1 15.25 3.5v13A1.25 1.25 0 0 1 14 17.75H6A1.25 1.25 0 0 1 4.75 16.5v-13Z" />
											</svg>
										{:else}
											<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 flex-shrink-0 text-emerald-500">
												<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
											</svg>
										{/if}
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
												{item.name}
											</p>
											<p class="truncate text-xs text-slate-500 dark:text-slate-400">
												{item.id}
											</p>
										</div>
										<button
											type="button"
											onclick={(e) => handleRemove(e, item.type, item.id)}
											class="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-slate-600"
											title="Remove from favorites"
										>
											<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
												<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
											</svg>
										</button>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
</script>
