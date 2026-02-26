<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { onDestroy, onMount, tick } from 'svelte';
	import type { DiagramMeta, DiagramsIndex } from '@emdzej/wds-core';
	import { treeSearchQuery } from '$lib/stores/search';
	import { favorites, toggleFavorite } from '$lib/stores/favorites';
	import { labelScale } from '$lib/stores/settings';

	let svgMarkup = $state<string | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let diagramMeta = $state<DiagramMeta | null>(null);
	let isFullscreen = $state(false);
	let svgHost: HTMLDivElement | null = null;
	let svgElement: SVGSVGElement | null = null;
	let loadCounter = 0;

	// ViewBox-based pan/zoom state
	let viewBox = $state({ x: 0, y: 0, width: 0, height: 0 });
	let originalViewBox = { x: 0, y: 0, width: 0, height: 0 };
	let isPanning = $state(false);
	let panStart = { x: 0, y: 0, viewX: 0, viewY: 0 };

	const diagramId = $derived($page.params.id ?? '');
	const modelId = $derived($page.params.model ?? '');

	const isFavorite = $derived(
		$favorites.some((item) => item.type === 'diagram' && item.id === diagramId)
	);

	const handleToggleFavorite = () => {
		const name = diagramMeta?.title ?? diagramId;
		toggleFavorite('diagram', diagramId, name);
	};

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

	const initViewBox = (svg: SVGSVGElement) => {
		// Get original viewBox or calculate from SVG dimensions
		const vb = svg.viewBox.baseVal;
		if (vb.width > 0 && vb.height > 0) {
			originalViewBox = { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
		} else {
			// Fallback to SVG dimensions
			const bbox = svg.getBBox();
			originalViewBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
		}
		viewBox = { ...originalViewBox };
		applyViewBox(svg);
	};

	const applyViewBox = (svg: SVGSVGElement) => {
		svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
	};

	const handleWheel = (event: WheelEvent) => {
		if (!svgElement || !svgHost) return;
		event.preventDefault();

		const rect = svgHost.getBoundingClientRect();
		// Mouse position relative to container (0-1)
		const mx = (event.clientX - rect.left) / rect.width;
		const my = (event.clientY - rect.top) / rect.height;

		// Zoom factor
		const delta = event.deltaY > 0 ? 1.1 : 0.9;
		const newWidth = viewBox.width * delta;
		const newHeight = viewBox.height * delta;

		// Limit zoom (min 10%, max 1000% of original)
		if (newWidth < originalViewBox.width * 0.1 || newWidth > originalViewBox.width * 10) return;

		// Adjust position to zoom toward mouse
		viewBox.x += (viewBox.width - newWidth) * mx;
		viewBox.y += (viewBox.height - newHeight) * my;
		viewBox.width = newWidth;
		viewBox.height = newHeight;

		applyViewBox(svgElement);
	};

	const handlePointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return; // Only left click
		if ((event.target as HTMLElement)?.closest('a')) return; // Don't pan on links

		isPanning = true;
		panStart = {
			x: event.clientX,
			y: event.clientY,
			viewX: viewBox.x,
			viewY: viewBox.y
		};
		svgHost?.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: PointerEvent) => {
		if (!isPanning || !svgElement || !svgHost) return;

		const rect = svgHost.getBoundingClientRect();
		// Convert pixel movement to viewBox units
		const scaleX = viewBox.width / rect.width;
		const scaleY = viewBox.height / rect.height;

		viewBox.x = panStart.viewX - (event.clientX - panStart.x) * scaleX;
		viewBox.y = panStart.viewY - (event.clientY - panStart.y) * scaleY;

		applyViewBox(svgElement);
	};

	const handlePointerUp = (event: PointerEvent) => {
		isPanning = false;
		svgHost?.releasePointerCapture(event.pointerId);
	};

	const decorateLinks = (svg: SVGSVGElement) => {
		const links = svg.querySelectorAll('a');
		links.forEach((link) => link.classList.add('wds-diagram-link'));
	};

	const applyLabelScale = (svg: SVGSVGElement, scale: number) => {
		const scaleFactor = scale / 100;
		// Original font sizes from SVG style
		const sizes: Record<string, number> = { t1: 31, t2: 42, t3: 12 };
		for (const [cls, baseSize] of Object.entries(sizes)) {
			const elements = svg.querySelectorAll(`text.${cls}`);
			elements.forEach((el) => {
				(el as SVGTextElement).style.fontSize = `${baseSize * scaleFactor}`;
			});
		}
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
				// Set search query in tree (handled by layout)
				treeSearchQuery.set(searchId);
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

			requestAnimationFrame(() => {
				const svg = svgHost?.querySelector('svg');
				if (!svg) return;
				detachSvgInteractions();
				svgElement = svg;
				decorateLinks(svg);
				applyLabelScale(svg, $labelScale);
				attachSvgInteractions(svg);
				initViewBox(svg);
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
		if (!svgElement) return;
		const factor = 0.8; // Zoom in = smaller viewBox
		const newWidth = viewBox.width * factor;
		const newHeight = viewBox.height * factor;
		// Center zoom
		viewBox.x += (viewBox.width - newWidth) / 2;
		viewBox.y += (viewBox.height - newHeight) / 2;
		viewBox.width = newWidth;
		viewBox.height = newHeight;
		applyViewBox(svgElement);
	};

	const zoomOut = () => {
		if (!svgElement) return;
		const factor = 1.25; // Zoom out = larger viewBox
		const newWidth = viewBox.width * factor;
		const newHeight = viewBox.height * factor;
		// Limit max zoom out
		if (newWidth > originalViewBox.width * 10) return;
		// Center zoom
		viewBox.x += (viewBox.width - newWidth) / 2;
		viewBox.y += (viewBox.height - newHeight) / 2;
		viewBox.width = newWidth;
		viewBox.height = newHeight;
		applyViewBox(svgElement);
	};

	const resetZoom = () => {
		if (!svgElement) return;
		viewBox = { ...originalViewBox };
		applyViewBox(svgElement);
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

	// React to label scale changes
	$effect(() => {
		const scale = $labelScale;
		if (!svgElement) return;
		applyLabelScale(svgElement, scale);
	});

	onMount(() => {
		document.addEventListener('fullscreenchange', updateFullscreen);
		return () => document.removeEventListener('fullscreenchange', updateFullscreen);
	});

	onDestroy(() => {
		detachSvgInteractions();
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
				onclick={handleToggleFavorite}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 {isFavorite
					? 'text-amber-500 hover:text-amber-600'
					: 'text-slate-400 hover:text-amber-500'}"
				type="button"
				title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
					/>
				</svg>
			</button>
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
			<div
				class="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700"
			>
				<label
					class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
					title="Label size"
				>
					<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path
							d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
						/>
					</svg>
					<input
						type="range"
						min="50"
						max="200"
						step="25"
						bind:value={$labelScale}
						class="w-20 h-1.5 accent-sky-500"
					/>
					<span class="w-8 text-right tabular-nums">{$labelScale}%</span>
				</label>
			</div>
		</div>
	</div>

	<!-- SVG Container (always white background for diagrams) -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={svgHost}
		class="relative flex-1 min-h-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 wds-diagram-container {isPanning
			? 'cursor-grabbing'
			: 'cursor-grab'}"
		onwheel={handleWheel}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
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
		/* Crisp SVG rendering at any zoom level */
		shape-rendering: geometricPrecision;
		text-rendering: geometricPrecision;
	}

	:global(.wds-diagram-container) {
		/* Force crisp rendering for transformed content */
		image-rendering: -webkit-optimize-contrast;
		image-rendering: crisp-edges;
		-webkit-font-smoothing: none;
	}
</style>
