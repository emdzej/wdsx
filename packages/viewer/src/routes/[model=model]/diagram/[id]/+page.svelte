<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { onDestroy, onMount, tick } from 'svelte';
	import panzoom from 'panzoom';
	import type { DiagramMeta, DiagramsIndex } from '@emdzej/wds-core';

	let svgMarkup = $state<string | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let diagramMeta = $state<DiagramMeta | null>(null);
	let isFullscreen = $state(false);
	let svgHost: HTMLDivElement | null = null;
	let svgElement: SVGSVGElement | null = null;
	let panzoomInstance: ReturnType<typeof panzoom> | null = null;
	let loadCounter = 0;

	const diagramId = $derived($page.params.id ?? '');
	const modelId = $derived($page.params.model ?? '');

	const parseSearchLink = (href: string): string | null => {
		const match = href.match(/search\(['"]([^'"]+)['"]\)/i);
		return match?.[1] ?? null;
	};

	const parseDiagramLink = (href: string): string | null => {
		const match = href.match(/([A-Za-z0-9_-]+)\.svgz?$/i);
		return match?.[1] ?? null;
	};

	const fetchSvgMarkup = async (file: string): Promise<string> => {
		const response = await fetch(`/data/diagrams/${file}`);
		if (!response.ok) {
			throw new Error(`Failed to load diagram ${file}`);
		}

		if (file.toLowerCase().endsWith('.svgz')) {
			const buffer = await response.arrayBuffer();
			if ('DecompressionStream' in window) {
				const stream = new DecompressionStream('gzip');
				const decompressed = new Response(new Blob([buffer]).stream().pipeThrough(stream));
				return await decompressed.text();
			}
			return await response.text();
		}

		return await response.text();
	};

	const setupPanzoom = (svg: SVGSVGElement) => {
		panzoomInstance?.dispose();
		
		// Important: panzoom needs the SVG to have proper dimensions
		svg.style.width = '100%';
		svg.style.height = '100%';
		svg.style.maxWidth = 'none';
		svg.style.maxHeight = 'none';
		
		panzoomInstance = panzoom(svg, {
			maxZoom: 10,
			minZoom: 0.1,
			zoomSpeed: 0.065,
			bounds: false,
			boundsPadding: 0.1,
			smoothScroll: false,
			// Enable mouse wheel zoom
			beforeWheel: () => false,
			// Filter touch events to allow pinch zoom
			filterKey: () => true
		});
	};

	const decorateLinks = (svg: SVGSVGElement) => {
		const links = svg.querySelectorAll('a');
		links.forEach((link) => link.classList.add('wds-diagram-link'));
	};

	const handleSvgClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement | null;
		const link = target?.closest('a');
		if (!link) return;

		const href = link.getAttribute('href') ?? link.getAttribute('xlink:href') ?? '';

		if (!href) return;
		event.preventDefault();

		if (href.startsWith('javascript:')) {
			const searchId = parseSearchLink(href);
			if (searchId) {
				void goto(resolve(`/search?component=${encodeURIComponent(searchId)}`));
				return;
			}
		}

		const diagramTarget = parseDiagramLink(href);
		if (diagramTarget) {
			void goto(resolve(`/${modelId}/diagram/${diagramTarget}`));
			return;
		}

		if (href.startsWith('http')) {
			window.open(href, '_blank', 'noopener');
			return;
		}
	};

	const handlePointerOver = (event: PointerEvent) => {
		const target = event.target as HTMLElement | null;
		const link = target?.closest('a');
		if (!link) return;
		link.classList.add('wds-link-hover');
	};

	const handlePointerOut = (event: PointerEvent) => {
		const target = event.target as HTMLElement | null;
		const link = target?.closest('a');
		if (!link) return;
		link.classList.remove('wds-link-hover');
	};

	const attachSvgInteractions = (svg: SVGSVGElement) => {
		svg.addEventListener('click', handleSvgClick);
		svg.addEventListener('pointerover', handlePointerOver);
		svg.addEventListener('pointerout', handlePointerOut);
	};

	const detachSvgInteractions = () => {
		if (!svgElement) return;
		svgElement.removeEventListener('click', handleSvgClick);
		svgElement.removeEventListener('pointerover', handlePointerOver);
		svgElement.removeEventListener('pointerout', handlePointerOut);
		svgElement = null;
	};

	const loadDiagram = async (id: string) => {
		const currentLoad = ++loadCounter;
		loading = true;
		error = null;
		svgMarkup = null;
		diagramMeta = null;

		try {
			const indexResponse = await fetch('/data/diagrams/index.json');
			if (!indexResponse.ok) {
				throw new Error('Failed to load diagrams index');
			}
			const index = (await indexResponse.json()) as DiagramsIndex;
			const meta = index.diagrams.find((diagram) => diagram.id === id);
			if (!meta) {
				throw new Error(`Diagram ${id} not found`);
			}
			diagramMeta = meta;
			const markup = await fetchSvgMarkup(meta.file);
			if (currentLoad !== loadCounter) return;
			svgMarkup = markup;
			await tick();
			
			// Wait for DOM update
			requestAnimationFrame(() => {
				const svg = svgHost?.querySelector('svg');
				if (!svg) return;
				detachSvgInteractions();
				svgElement = svg;
				decorateLinks(svg);
				attachSvgInteractions(svg);
				setupPanzoom(svg);
			});
		} catch (err) {
			if (currentLoad !== loadCounter) return;
			error = err instanceof Error ? err.message : 'Failed to load diagram';
		} finally {
			if (currentLoad === loadCounter) {
				loading = false;
			}
		}
	};

	const zoomIn = () => {
		if (!panzoomInstance || !svgHost) return;
		const rect = svgHost.getBoundingClientRect();
		panzoomInstance.smoothZoom(rect.width / 2, rect.height / 2, 1.5);
	};

	const zoomOut = () => {
		if (!panzoomInstance || !svgHost) return;
		const rect = svgHost.getBoundingClientRect();
		panzoomInstance.smoothZoom(rect.width / 2, rect.height / 2, 0.67);
	};

	const resetZoom = () => {
		if (!panzoomInstance) return;
		panzoomInstance.moveTo(0, 0);
		panzoomInstance.zoomAbs(0, 0, 1);
	};

	const toggleFullscreen = () => {
		if (!svgHost) return;
		if (!document.fullscreenElement) {
			void svgHost.requestFullscreen();
		} else {
			void document.exitFullscreen();
		}
	};

	const updateFullscreen = () => {
		isFullscreen = Boolean(document.fullscreenElement);
	};

	$effect(() => {
		if (!diagramId) return;
		void loadDiagram(diagramId);
	});

	onMount(() => {
		document.addEventListener('fullscreenchange', updateFullscreen);
		return () => document.removeEventListener('fullscreenchange', updateFullscreen);
	});

	onDestroy(() => {
		detachSvgInteractions();
		panzoomInstance?.dispose();
	});
</script>

<div class="flex h-full flex-col">
	<!-- Header with controls -->
	<div class="flex flex-wrap items-center justify-between gap-3 pb-3 wds-no-print">
		<div class="min-w-0">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				Diagram
			</p>
			<h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
				{diagramId}
			</h1>
			{#if diagramMeta?.title}
				<p class="text-sm text-slate-600 dark:text-slate-300 truncate">{diagramMeta.title}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={zoomOut}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
				type="button"
				title="Zoom out (or scroll down)"
			>
				−
			</button>
			<button
				onclick={resetZoom}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
				type="button"
				title="Reset zoom"
			>
				1:1
			</button>
			<button
				onclick={zoomIn}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
				type="button"
				title="Zoom in (or scroll up)"
			>
				+
			</button>
			<button
				onclick={toggleFullscreen}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
				type="button"
			>
				{isFullscreen ? '⛶' : '⛶'}
			</button>
		</div>
	</div>

	<!-- SVG Container -->
	<div
		bind:this={svgHost}
		class="relative flex-1 min-h-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 wds-diagram-container"
	>
		{#if loading}
			<div class="flex h-full flex-col items-center justify-center gap-4 px-6">
				<div class="skeleton h-20 w-20 rounded-full"></div>
				<div class="w-full max-w-xs space-y-2">
					<div class="skeleton-line w-1/2 mx-auto"></div>
					<div class="skeleton-line"></div>
				</div>
			</div>
		{:else if error}
			<div class="flex h-full items-center justify-center text-sm text-rose-500">
				{error}
			</div>
		{:else if svgMarkup}
			<div class="h-full w-full overflow-hidden">
				<!-- eslint-disable svelte/no-at-html-tags -->
				{@html svgMarkup}
				<!-- eslint-enable svelte/no-at-html-tags -->
			</div>
		{/if}
	</div>
	
	<p class="mt-2 text-xs text-slate-400 dark:text-slate-500 wds-no-print">
		Scroll to zoom • Drag to pan • Click links to navigate
	</p>
</div>

<style>
	:global(.wds-diagram-link) {
		cursor: pointer;
	}

	:global(.wds-diagram-link.wds-link-hover *),
	:global(.wds-diagram-link:hover *) {
		stroke: #38bdf8 !important;
		stroke-width: 2;
	}
	
	:global(.wds-diagram-container svg) {
		display: block;
		max-width: none !important;
		max-height: none !important;
	}
</style>
