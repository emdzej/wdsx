<script lang="ts" context="module">
	import { error } from '@sveltejs/kit';

	export const load = async ({ fetch, params }: { fetch: typeof globalThis.fetch; params: Record<string, string> }) => {
		const response = await fetch(`/data/info/${params.id}.md`);
		if (!response.ok) {
			throw error(404, `Info document ${params.id} not found`);
		}
		const markdown = await response.text();
		return { markdown };
	};
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import { navigating, page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import InfoViewer from '$lib/components/InfoViewer.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { findDiagramsForComponent, type ComponentDiagramUsage } from '$lib/utils/component-lookup';

	export let data: { markdown: string };

	let relatedDiagrams: ComponentDiagramUsage[] = [];
	let relatedLoading = false;

	$: if (browser && $page.params.id) {
		relatedLoading = true;
		findDiagramsForComponent($page.params.id, { preferModel: $page.params.model })
			.then((value) => {
				relatedDiagrams = value;
			})
			.finally(() => {
				relatedLoading = false;
			});
	} else {
		relatedDiagrams = [];
		relatedLoading = false;
	}
</script>

<section class="flex min-h-screen flex-col gap-6 pb-10">
	<Breadcrumb
		items={[
			{ label: 'Models', href: '/' },
			{ label: $page.params.model ?? '', href: `/${$page.params.model}` },
			{ label: 'Info' },
			{ label: $page.params.id ?? '' }
		]}
	/>

	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Info: {$page.params.id}</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Technical information and reference notes.
		</p>
	</div>

	<div class="mx-auto w-full max-w-5xl space-y-6">
		{#if $navigating}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
				<Spinner label="Loading info" />
			</div>
		{:else if data.markdown}
			<InfoViewer markdown={data.markdown} />
		{:else}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
				No info document found for this ID.
			</div>
		{/if}

		<section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-base font-semibold text-slate-900 dark:text-white">Related diagrams</h2>
					<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
						Where this component appears across diagrams.
					</p>
				</div>
				<a
					class="text-xs font-medium text-blue-600 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-blue-300"
					href={`/search?q=${encodeURIComponent($page.params.id ?? '')}`}
				>
					Search all
				</a>
			</div>
			{#if relatedLoading}
				<div class="mt-3">
					<Spinner label="Looking up diagrams" />
				</div>
			{:else if relatedDiagrams.length === 0}
				<div class="mt-3 text-sm text-slate-500 dark:text-slate-400">
					No diagrams were indexed for this component yet.
				</div>
			{:else}
				<ul class="mt-3 grid gap-2 sm:grid-cols-2">
					{#each relatedDiagrams as diagram}
						<li>
							<a
								class="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800"
								href={`/${diagram.models.includes($page.params.model ?? '') ? $page.params.model : diagram.models[0] ?? $page.params.model}/diagram/${diagram.id}`}
							>
								<div class="font-semibold">{diagram.id}</div>
								<div class="text-xs text-slate-500 dark:text-slate-400">
									Models: {diagram.models.join(', ') || 'unknown'}
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</section>
