<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { Index } from 'flexsearch';
	import type { DiagramMeta, InfoPageMeta, ModelReference } from '@emdzej/wds-core';
	import { loadDiagramsIndex, loadInfoIndex } from '$lib/data/loaders';
	import SearchInput from '$lib/components/SearchInput.svelte';

	type SearchItemType = 'diagram' | 'info';

	type SearchItem = {
		key: string;
		id: string;
		type: SearchItemType;
		title: string;
		subtitle: string;
		referencedBy: ModelReference[];
	};

	let query = $state('');
	let results = $state<SearchItem[]>([]);
	let searchIndex = $state<Index | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let enabledTypes = new SvelteSet<SearchItemType>(['diagram', 'info']);
	let itemsByKey = new SvelteMap<string, SearchItem>();
	let lastPageQuery = $state('');

	const pageQuery = $derived(browser ? ($page.url.searchParams.get('q') ?? '') : '');

	$effect(() => {
		if (pageQuery !== lastPageQuery) {
			query = pageQuery;
			lastPageQuery = pageQuery;
		}
	});

	const buildIndex = (diagrams: DiagramMeta[], infoPages: InfoPageMeta[]) => {
		const index = new Index({
			preset: 'match',
			tokenize: 'forward',
			cache: true
		});

		itemsByKey = new SvelteMap();

		for (const diagram of diagrams) {
			const title = diagram.title ?? diagram.id;
			const subtitle = diagram.title ? diagram.id : 'Diagram';
			const key = `diagram:${diagram.id}`;
			const item: SearchItem = {
				key,
				id: diagram.id,
				type: 'diagram',
				title,
				subtitle,
				referencedBy: diagram.referencedBy ?? []
			};
			const searchText = [title, diagram.id, ...item.referencedBy.map((ref) => ref.model)]
				.filter(Boolean)
				.join(' ');
			index.add(key, searchText);
			itemsByKey.set(key, item);
		}

		for (const page of infoPages) {
			const title = page.title ?? page.id;
			const subtitle = page.sections?.length ? page.sections.slice(0, 3).join(' • ') : page.id;
			const key = `info:${page.id}`;
			const item: SearchItem = {
				key,
				id: page.id,
				type: 'info',
				title,
				subtitle,
				referencedBy: page.referencedBy ?? []
			};
			const searchText = [
				title,
				page.id,
				...(page.sections ?? []),
				...item.referencedBy.map((ref) => ref.model)
			]
				.filter(Boolean)
				.join(' ');
			index.add(key, searchText);
			itemsByKey.set(key, item);
		}

		searchIndex = index;
	};

	onMount(async () => {
		try {
			const [diagramsIndex, infoIndex] = await Promise.all([
				loadDiagramsIndex(fetch),
				loadInfoIndex(fetch)
			]);
			buildIndex(diagramsIndex.diagrams, infoIndex.pages);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load search index.';
		} finally {
			loading = false;
		}
	});

	$effect(() => {
		if (!searchIndex) return;
		const term = query.trim();
		if (!term) {
			results = [];
			return;
		}
		const ids = searchIndex.search(term, { limit: 200 }) as string[];
		results = ids
			.map((id) => itemsByKey.get(String(id)))
			.filter((item): item is SearchItem => Boolean(item));
	});

	const toPathname = (path: string) => path as App.Pathname;

	const handleSearch = (term: string) => {
		const trimmed = term.trim();
		const target = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search';
		void goto(resolve(toPathname(target)));
	};

	const toggleType = (type: SearchItemType) => {
		if (enabledTypes.has(type)) {
			enabledTypes.delete(type);
		} else {
			enabledTypes.add(type);
		}
	};

	const filteredResults = $derived(results.filter((item) => enabledTypes.has(item.type)));

	const groupedResults = $derived.by(() => ({
		diagram: filteredResults.filter((item) => item.type === 'diagram'),
		info: filteredResults.filter((item) => item.type === 'info')
	}));

	const typeCounts = $derived.by(() => {
		const counts = { diagram: 0, info: 0 };
		for (const item of results) {
			counts[item.type] += 1;
		}
		return counts;
	});

	const linkPath = (item: SearchItem, modelId: string) =>
		`/${modelId}/${item.type === 'diagram' ? 'diagram' : 'info'}/${item.id}`;
</script>

<section class="space-y-6">
	<div>
		<p class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
			Global search
		</p>
		<h1 class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Search</h1>
		<p class="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
			Search across diagrams and information pages. Use the type filters to narrow results.
		</p>
	</div>

	<SearchInput
		class="w-full max-w-3xl"
		bind:value={query}
		placeholder="Search diagrams, info pages, sections…"
		onSearch={handleSearch}
	/>

	<div class="flex flex-wrap items-center gap-3">
		<span class="text-sm font-medium text-slate-500 dark:text-slate-400">Filter by type</span>
		<label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
			<input
				type="checkbox"
				class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400 dark:border-slate-600"
				checked={enabledTypes.has('diagram')}
				onchange={() => toggleType('diagram')}
			/>
			Diagrams ({typeCounts.diagram})
		</label>
		<label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
			<input
				type="checkbox"
				class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400 dark:border-slate-600"
				checked={enabledTypes.has('info')}
				onchange={() => toggleType('info')}
			/>
			Info pages ({typeCounts.info})
		</label>
	</div>

	{#if loading}
		<div
			class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
		>
			Building search index…
		</div>
	{:else if error}
		<div
			class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
		>
			<p class="font-semibold">Failed to load search data</p>
			<p class="mt-2 text-sm opacity-80">{error}</p>
		</div>
	{:else if !query.trim()}
		<div
			class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
		>
			Type a keyword to search diagrams and information pages.
		</div>
	{:else if filteredResults.length === 0}
		<div
			class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
		>
			No results for "{query}". Try a different keyword or adjust filters.
		</div>
	{:else}
		<div class="space-y-6">
			{#if groupedResults.diagram.length}
				<section
					class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
				>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Diagrams</h2>
						<span class="text-sm text-slate-500 dark:text-slate-400">
							{groupedResults.diagram.length} results
						</span>
					</div>
					<ul class="space-y-4">
						{#each groupedResults.diagram as item (item.key)}
							<li class="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
								<p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
									{item.title}
								</p>
								<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
								{#if item.referencedBy.length}
									<div class="mt-3 flex flex-wrap gap-2">
										{#each item.referencedBy as ref (ref.model)}
											<a
												href={resolve(toPathname(linkPath(item, ref.model)))}
												class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
											>
												{ref.model} ({ref.occurrences})
											</a>
										{/each}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if groupedResults.info.length}
				<section
					class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
				>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Info pages</h2>
						<span class="text-sm text-slate-500 dark:text-slate-400">
							{groupedResults.info.length} results
						</span>
					</div>
					<ul class="space-y-4">
						{#each groupedResults.info as item (item.key)}
							<li class="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
								<p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
									{item.title}
								</p>
								<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
								{#if item.referencedBy.length}
									<div class="mt-3 flex flex-wrap gap-2">
										{#each item.referencedBy as ref (ref.model)}
											<a
												href={resolve(toPathname(linkPath(item, ref.model)))}
												class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
											>
												{ref.model} ({ref.occurrences})
											</a>
										{/each}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	{/if}
</section>
