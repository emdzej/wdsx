<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import SvgViewer from '$lib/components/SvgViewer.svelte';
	import { findInfoForComponents } from '$lib/utils/component-lookup';

	let selectedPart: string | null = null;
	let componentIds: string[] = [];
	let relatedInfo: Array<{ id: string; title: string; models: string[] }> = [];
	let relatedInfoLoading = false;

	const diagramSrc = () => `/data/diagrams/${$page.params.id}.svg`;

	function handleSearch(event: CustomEvent<{ id: string }>) {
		selectedPart = event.detail.id;
		goto(`/search?q=${encodeURIComponent(event.detail.id)}`);
	}

	function handleComponents(event: CustomEvent<{ ids: string[] }>) {
		componentIds = event.detail.ids;
	}

	$: if (browser && componentIds.length) {
		relatedInfoLoading = true;
		findInfoForComponents(componentIds, { preferModel: $page.params.model })
			.then((value) => {
				relatedInfo = value;
			})
			.finally(() => {
				relatedInfoLoading = false;
			});
	} else {
		relatedInfo = [];
		relatedInfoLoading = false;
	}
</script>

<section class="flex min-h-screen flex-col gap-4 pb-6">
	<Breadcrumb
		items={[
			{ label: 'Models', href: '/' },
			{ label: $page.params.model, href: `/${$page.params.model}` },
			{ label: $page.params.id }
		]}
	/>

	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Diagram: {$page.params.id}</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Pan, zoom, and follow diagram links. Press F for fullscreen.
		</p>
		{#if selectedPart}
			<div class="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
				Linked part: {selectedPart}
			</div>
		{/if}
	</div>

	<SvgViewer src={diagramSrc()} on:search={handleSearch} on:components={handleComponents} />

	{#if componentIds.length}
		<section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-base font-semibold text-slate-900 dark:text-white">Related info</h2>
					<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
						{componentIds.length} linked components detected in this diagram.
					</p>
				</div>
				<a
					class="text-xs font-medium text-blue-600 hover:underline dark:text-blue-300"
					href={`/search?q=${encodeURIComponent(componentIds.join(' '))}`}
				>
					Search all
				</a>
			</div>
			{#if relatedInfoLoading}
				<div class="mt-3 text-sm text-slate-500 dark:text-slate-400">Looking up info pages…</div>
			{:else if relatedInfo.length === 0}
				<div class="mt-3 text-sm text-slate-500 dark:text-slate-400">
					No info pages matched these components yet.
				</div>
			{:else}
				<ul class="mt-3 grid gap-2 sm:grid-cols-2">
					{#each relatedInfo as info}
						<li>
							<a
								class="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800"
								href={`/${info.models.includes($page.params.model) ? $page.params.model : info.models[0] ?? $page.params.model}/info/${info.id}`}
							>
								<div class="font-semibold">{info.id}</div>
								<div class="text-xs text-slate-500 dark:text-slate-400">{info.title}</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</section>
