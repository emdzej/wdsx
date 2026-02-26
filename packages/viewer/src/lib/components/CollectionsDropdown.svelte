<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		collections,
		deleteCollection,
		removeFromCollection,
		type Collection
	} from '$lib/stores/collections';
	import { currentModelId } from '$lib/stores/favorites';
	import { selectedItem } from '$lib/stores/search';

	let isOpen = $state(false);
	let expandedCollectionId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);

	const handleClickOutside = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.collections-dropdown')) {
			isOpen = false;
			expandedCollectionId = null;
			deleteConfirmId = null;
		}
	};

	const toggleCollection = (id: string) => {
		expandedCollectionId = expandedCollectionId === id ? null : id;
		deleteConfirmId = null;
	};

	const handleItemClick = (item: { type: 'diagram' | 'info'; id: string; name: string }) => {
		const modelId = $currentModelId;
		if (!modelId) return;

		selectedItem.set({ type: item.type, id: item.id });
		void goto(resolve(`/${modelId}/${item.type}/${item.id}`));
		isOpen = false;
		expandedCollectionId = null;
	};

	const handleRemoveItem = (
		e: MouseEvent,
		collectionId: string,
		type: 'diagram' | 'info',
		id: string
	) => {
		e.stopPropagation();
		removeFromCollection(collectionId, type, id);
	};

	const handleDeleteCollection = (e: MouseEvent, id: string) => {
		e.stopPropagation();
		if (deleteConfirmId === id) {
			deleteCollection(id);
			deleteConfirmId = null;
			expandedCollectionId = null;
		} else {
			deleteConfirmId = id;
		}
	};

	const totalItems = $derived($collections.reduce((sum, c) => sum + c.items.length, 0));
</script>

<svelte:window onclick={handleClickOutside} />

<div class="collections-dropdown relative">
	<button
		type="button"
		class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
		onclick={() => (isOpen = !isOpen)}
		aria-label="Collections"
		title="Collections"
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
			<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
		</svg>
		<span class="hidden sm:inline">Collections</span>
		{#if totalItems > 0}
			<span
				class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
			>
				{totalItems}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
		>
			<div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
				<h3 class="font-semibold text-slate-900 dark:text-white">Collections</h3>
				<p class="text-xs text-slate-500 dark:text-slate-400">
					{$collections.length} collection{$collections.length !== 1 ? 's' : ''}, {totalItems} item{totalItems !== 1 ? 's' : ''}
				</p>
			</div>

			<div class="max-h-96 overflow-y-auto">
				{#if $collections.length === 0}
					<div class="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							class="mx-auto mb-2 h-8 w-8 opacity-50"
						>
							<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
						</svg>
						<p>No collections yet</p>
						<p class="mt-1 text-xs">Add items to collections from diagram or info pages</p>
					</div>
				{:else}
					{#each $collections as collection (collection.id)}
						<div class="border-b border-slate-100 last:border-0 dark:border-slate-800">
							<!-- Collection header -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<div
								role="button"
								tabindex="0"
								class="flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
								onclick={() => toggleCollection(collection.id)}
								onkeydown={(e) => e.key === 'Enter' && toggleCollection(collection.id)}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									class="h-4 w-4 transition-transform {expandedCollectionId === collection.id
										? 'rotate-90'
										: ''}"
								>
									<polyline points="9 18 15 12 9 6" />
								</svg>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									class="h-4 w-4 text-indigo-500"
								>
									<path
										d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
									/>
								</svg>
								<span class="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
									{collection.name}
								</span>
								<span class="text-xs text-slate-400">{collection.items.length}</span>
								<button
									type="button"
									class="ml-1 rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
									onclick={(e) => handleDeleteCollection(e, collection.id)}
									title={deleteConfirmId === collection.id ? 'Click again to confirm' : 'Delete collection'}
								>
									{#if deleteConfirmId === collection.id}
										<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 text-red-500">
											<path
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
											/>
										</svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
											<polyline points="3 6 5 6 21 6" />
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
										</svg>
									{/if}
								</button>
							</div>

							<!-- Collection items (expanded) -->
							{#if expandedCollectionId === collection.id}
								<div class="bg-slate-50 dark:bg-slate-800/50">
									{#if collection.items.length === 0}
										<p class="px-4 py-3 text-center text-xs text-slate-400">Empty collection</p>
									{:else}
										{#each collection.items as item (`${item.type}-${item.id}`)}
											<div
												role="button"
												tabindex="0"
												onclick={() => handleItemClick(item)}
												onkeydown={(e) => e.key === 'Enter' && handleItemClick(item)}
												class="group flex w-full cursor-pointer items-center gap-2 px-4 py-2 pl-10 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700"
											>
												{#if item.type === 'diagram'}
													<svg
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														class="h-4 w-4 flex-shrink-0 text-sky-500"
													>
														<rect x="3" y="3" width="18" height="18" rx="2" />
														<path d="M3 9h18M9 21V9" />
													</svg>
												{:else}
													<svg
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														class="h-4 w-4 flex-shrink-0 text-emerald-500"
													>
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
														<polyline points="14 2 14 8 20 8" />
														<line x1="16" y1="13" x2="8" y2="13" />
														<line x1="16" y1="17" x2="8" y2="17" />
													</svg>
												{/if}
												<span class="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
													{item.name}
												</span>
												<button
													type="button"
													class="flex-shrink-0 rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-slate-600 dark:hover:text-red-400"
													onclick={(e) => { e.stopPropagation(); handleRemoveItem(e, collection.id, item.type, item.id); }}
													title="Remove from collection"
												>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
														<line x1="18" y1="6" x2="6" y2="18" />
														<line x1="6" y1="6" x2="18" y2="18" />
													</svg>
												</button>
											</div>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
