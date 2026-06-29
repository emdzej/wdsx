<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { history, clearHistory } from '$lib/stores/history';
	import { selectedItem } from '$lib/stores/search';

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement | null = null;

	const modelId = $derived($page.params.model ?? '');
	const allHistory = $derived($history);

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
		const path =
			item.type === 'diagram' ? `/${modelId}/diagram/${item.id}` : `/${modelId}/info/${item.id}`;
		void goto(resolve(path as `/${string}`));
		isOpen = false;
	};

	const handleClear = (event: MouseEvent) => {
		event.stopPropagation();
		clearHistory();
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
			title="Recently viewed"
		>
			<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="hidden sm:inline">History</span>
			{#if allHistory.length > 0}
				<span
					class="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
				>
					{allHistory.length}
				</span>
			{/if}
		</button>

		{#if isOpen}
			<div
				class="absolute left-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
			>
				<div
					class="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700"
				>
					<span
						class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
						>Recently Viewed</span
					>
					{#if allHistory.length > 0}
						<button
							type="button"
							onclick={handleClear}
							class="text-xs text-slate-400 hover:text-red-500 transition"
						>
							Clear all
						</button>
					{/if}
				</div>

				<div class="max-h-80 overflow-y-auto">
					{#if allHistory.length === 0}
						<div class="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
							<svg
								class="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
									clip-rule="evenodd"
								/>
							</svg>
							No history yet.<br />
							<span class="text-xs">Visit diagrams or info pages to build history.</span>
						</div>
					{:else}
						<ul class="py-1">
							{#each allHistory as item (item.type + ':' + item.id + ':' + item.timestamp)}
								<li>
									<div
										role="button"
										tabindex="0"
										onclick={() => navigateToItem(item)}
										onkeydown={(e) => e.key === 'Enter' && navigateToItem(item)}
										class="group flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
									>
										{#if item.type === 'diagram'}
											<svg
												viewBox="0 0 20 20"
												fill="currentColor"
												class="h-4 w-4 flex-shrink-0 text-sky-500"
											>
												<path
													d="M4.75 3.5A1.25 1.25 0 0 1 6 2.25h8A1.25 1.25 0 0 1 15.25 3.5v13A1.25 1.25 0 0 1 14 17.75H6A1.25 1.25 0 0 1 4.75 16.5v-13Z"
												/>
											</svg>
										{:else}
											<svg
												viewBox="0 0 20 20"
												fill="currentColor"
												class="h-4 w-4 flex-shrink-0 text-emerald-500"
											>
												<path
													fill-rule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
													clip-rule="evenodd"
												/>
											</svg>
										{/if}
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium text-slate-900 dark:text-slate-100">
												{item.name}
												<span class="font-normal text-slate-500 dark:text-slate-400"
													>({item.id})</span
												>
											</p>
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
