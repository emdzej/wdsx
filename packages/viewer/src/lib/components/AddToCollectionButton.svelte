<script lang="ts">
	import {
		collections,
		createCollection,
		addToCollection
	} from '$lib/stores/collections';

	let {
		type,
		id,
		name
	}: {
		type: 'diagram' | 'info';
		id: string;
		name: string;
	} = $props();

	let isOpen = $state(false);
	let newCollectionName = $state('');
	let showNewInput = $state(false);
	let message = $state<string | null>(null);

	// Reactive - uses $collections store directly
	const isInCollection = (collectionId: string) =>
		$collections.find((c) => c.id === collectionId)?.items.some(
			(item) => item.type === type && item.id === id
		) ?? false;

	const handleClickOutside = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.add-to-collection')) {
			isOpen = false;
			showNewInput = false;
			newCollectionName = '';
		}
	};

	const handleAddToCollection = (collectionId: string, collectionName: string) => {
		addToCollection(collectionId, type, id, name);
		message = `Added to "${collectionName}"`;
		setTimeout(() => {
			message = null;
			isOpen = false;
		}, 1500);
	};

	const handleCreateAndAdd = () => {
		const trimmed = newCollectionName.trim();
		console.log('handleCreateAndAdd called, name:', trimmed);
		if (!trimmed) {
			console.log('Name is empty, returning');
			return;
		}

		const collectionId = createCollection(trimmed);
		console.log('createCollection returned:', collectionId);
		if (collectionId) {
			addToCollection(collectionId, type, id, name);
			message = `Created "${trimmed}" and added item`;
			newCollectionName = '';
			showNewInput = false;
			setTimeout(() => {
				message = null;
				isOpen = false;
			}, 1500);
		} else {
			console.log('createCollection failed - check if currentModelId is set');
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleCreateAndAdd();
		} else if (e.key === 'Escape') {
			showNewInput = false;
			newCollectionName = '';
		}
	};
</script>

<svelte:window onclick={handleClickOutside} />

<div class="add-to-collection relative">
	<button
		type="button"
		class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
		onclick={() => (isOpen = !isOpen)}
		title="Add to collection"
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
			<line x1="12" y1="11" x2="12" y2="17" />
			<line x1="9" y1="14" x2="15" y2="14" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 top-full z-[100] mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
		>
			<div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
				<h3 class="text-sm font-semibold text-slate-900 dark:text-white">Add to Collection</h3>
			</div>

			{#if message}
				<div class="px-4 py-3 text-center">
					<p class="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
				</div>
			{:else}
				<div class="max-h-64 overflow-y-auto p-2">
					{#if $collections.length > 0}
						{#each $collections as collection (collection.id)}
							{@const alreadyIn = isInCollection(collection.id)}
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition {alreadyIn
									? 'cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
									: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}"
								onclick={() => !alreadyIn && handleAddToCollection(collection.id, collection.name)}
								disabled={alreadyIn}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									class="h-4 w-4 {alreadyIn ? 'text-slate-300 dark:text-slate-600' : 'text-indigo-500'}"
								>
									<path
										d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
									/>
								</svg>
								<span class="flex-1 truncate">{collection.name}</span>
								{#if alreadyIn}
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										class="h-4 w-4 text-emerald-500"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								{:else}
									<span class="text-xs text-slate-400">{collection.items.length}</span>
								{/if}
							</button>
						{/each}
					{/if}

					{#if showNewInput}
						<div class="mt-2 flex gap-2 px-1">
							<input
								type="text"
								class="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
								placeholder="Collection name..."
								bind:value={newCollectionName}
								onkeydown={handleKeydown}
							/>
							<button
								type="button"
								class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
								onclick={handleCreateAndAdd}
								disabled={!newCollectionName.trim()}
							>
								Add
							</button>
						</div>
					{:else}
						<button
							type="button"
							class="mt-2 flex w-full items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
							onclick={() => (showNewInput = true)}
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
							Create new collection
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
