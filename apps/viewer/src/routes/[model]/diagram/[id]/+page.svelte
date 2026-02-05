<script lang="ts">
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import SvgViewer from '$lib/components/SvgViewer.svelte';

	let selectedPart: string | null = null;

	const diagramSrc = () => `/data/diagrams/${$page.params.id}.svg`;

	function handleSearch(event: CustomEvent<{ id: string }>) {
		selectedPart = event.detail.id;
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

	<SvgViewer src={diagramSrc()} on:search={handleSearch} />
</section>
