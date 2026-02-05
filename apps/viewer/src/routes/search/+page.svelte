<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { search, type SearchResult, type SearchItemType } from '$lib/utils/search-index';
	import type { ModelIndexEntry } from '$lib/utils/data-loader';

	export let data: { models: ModelIndexEntry[] };

	let query = '';
	let typeFilter: 'all' | SearchItemType = 'all';
	let modelFilter = 'all';
	let results: SearchResult[] = [];
	let loading = false;

	const escapeHtml = (value: string) =>
		value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

	const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	const highlight = (value: string, rawQuery: string) => {
		const trimmed = rawQuery.trim();
		if (!trimmed) return escapeHtml(value);
		const terms = trimmed.split(/\s+/).map(escapeRegExp).filter(Boolean);
		if (!terms.length) return escapeHtml(value);
		const regex = new RegExp(`(${terms.join('|')})`, 'gi');
		return escapeHtml(value).replace(
			regex,
			'<mark class="rounded bg-yellow-200/70 px-1 py-0.5 text-yellow-900 dark:bg-yellow-400/20 dark:text-yellow-200">$1</mark>'
		);
	};

	const getResultLink = (result: SearchResult) => {
		const model = result.models[0];
		return model ? `/${model}/${result.type}/${result.id}` : '#';
	};

	$: query = $page.url.searchParams.get('q') ?? '';

	$: if (browser && query.trim()) {
		loading = true;
		search(query, {
			limit: 200,
			filters: {
				type: typeFilter === 'all' ? undefined : typeFilter,
				model: modelFilter === 'all' ? undefined : modelFilter
			}
		}).then((value) => {
			results = value;
			loading = false;
		});
	} else {
		results = [];
		loading = false;
	}
</script>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Search</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Browse diagrams and info pages across all models.
		</p>
	</div>

	<div class="flex flex-wrap items-center gap-4">
		<div class="min-w-[160px]">
			<label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				Type
			</label>
			<select
				bind:value={typeFilter}
				class="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
			>
				<option value="all">All</option>
				<option value="diagram">Diagrams</option>
				<option value="info">Info</option>
			</select>
		</div>
		<div class="min-w-[200px]">
			<label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				Model
			</label>
			<select
				bind:value={modelFilter}
				class="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
			>
				<option value="all">All models</option>
				{#each data.models as model}
					<option value={model.id}>{model.name} ({model.id})</option>
				{/each}
			</select>
		</div>
		<div class="text-sm text-slate-500 dark:text-slate-400">
			{#if query.trim()}
				{#if loading}
					Searching...
				{:else}
					{results.length} results
				{/if}
			{:else}
				Enter a search query to get started.
			{/if}
		</div>
	</div>

	{#if query.trim()}
		<div class="space-y-3">
			{#if loading}
				<div class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
					Working on it...
				</div>
			{:else if results.length === 0}
				<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
					No matches found for “{query}”. Try a different ID or keyword.
				</div>
			{:else}
				<ul class="space-y-3">
					{#each results as result}
						<li>
							<a
								href={getResultLink(result)}
								class="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
							>
								<div class="flex flex-wrap items-center justify-between gap-3">
									<div>
										<div class="text-base font-semibold text-slate-800 dark:text-slate-100">
											{@html highlight(result.title, query)}
										</div>
										<div class="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
											{result.type === 'diagram' ? 'Diagram' : 'Info'}
										</div>
									</div>
									<div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
										<span class="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-700">{result.id}</span>
										{#each result.models as model}
											<span class="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-700">{model}</span>
										{/each}
									</div>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</section>
