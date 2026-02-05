<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { search, type SearchResult } from '$lib/utils/search-index';

	let query = '';
	let results: SearchResult[] = [];
	let open = false;
	let loading = false;
	let inputEl: HTMLInputElement | null = null;
	let debounce: ReturnType<typeof setTimeout> | null = null;

	const runSearch = async () => {
		const trimmed = query.trim();
		if (!trimmed) {
			results = [];
			open = false;
			return;
		}

		loading = true;
		results = await search(trimmed, { limit: 8 });
		loading = false;
		open = true;
	};

	const scheduleSearch = () => {
		if (debounce) clearTimeout(debounce);
		debounce = setTimeout(runSearch, 120);
	};

	const handleSubmit = () => {
		const trimmed = query.trim();
		if (!trimmed) return;
		goto(`/search?q=${encodeURIComponent(trimmed)}`);
		open = false;
	};

	const getResultLink = (result: SearchResult) => {
		const model = result.models[0];
		return model ? `/${model}/${result.type}/${result.id}` : '#';
	};

	onMount(() => {
		const handler = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				inputEl?.focus();
				inputEl?.select();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});
</script>

<div class="relative w-full max-w-md">
	<form
		class="flex items-center gap-2"
		on:submit|preventDefault={handleSubmit}
		role="search"
	>
		<div class="relative flex-1">
			<input
				bind:this={inputEl}
				bind:value={query}
				class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-16 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
				placeholder="Search diagrams & info..."
				on:input={scheduleSearch}
				on:focus={() => (open = results.length > 0)}
				on:blur={() => setTimeout(() => (open = false), 150)}
				aria-label="Search"
			/>
			<span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
				⌘K / Ctrl+K
			</span>
		</div>
		<button
			type="submit"
			class="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
		>
			Search
		</button>
	</form>

	{#if open && query.trim()}
		<div class="absolute left-0 right-0 top-[3.2rem] z-30 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl dark:border-slate-800 dark:bg-slate-950">
			{#if loading}
				<div class="px-3 py-2 text-slate-500 dark:text-slate-400">Searching...</div>
			{:else if results.length === 0}
				<div class="px-3 py-2 text-slate-500 dark:text-slate-400">No matches found.</div>
			{:else}
				<ul class="divide-y divide-slate-100 dark:divide-slate-800">
					{#each results as result}
						<li>
							<a
								href={getResultLink(result)}
								class="flex items-start justify-between gap-3 rounded-md px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
							>
								<div>
									<div class="font-medium text-slate-800 dark:text-slate-100">{result.title}</div>
									<div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
										{result.type === 'diagram' ? 'Diagram' : 'Info'} · {result.models.join(', ')}
									</div>
								</div>
								<span class="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
									{result.id}
								</span>
							</a>
						</li>
					{/each}
				</ul>
				<div class="mt-2 border-t border-slate-100 pt-2 text-right text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
					<a href={`/search?q=${encodeURIComponent(query.trim())}`} class="hover:text-slate-700 dark:hover:text-slate-200">
						View all results →
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
