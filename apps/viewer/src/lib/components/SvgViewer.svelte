<script lang="ts">
	import { browser } from '$app/environment';
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import panzoom from 'panzoom';
	import { extractComponentIds } from '$lib/utils/svg-components';
	import Spinner from '$lib/components/Spinner.svelte';

	export let src: string;
	export let height = 'calc(100vh - 12rem)';
	export let dark = true;

	const dispatch = createEventDispatcher<{ search: { id: string }; components: { ids: string[] } }>();

	let container: HTMLDivElement;
	let viewport: HTMLDivElement;
	let viewer: HTMLDivElement;
	let svgMarkup = '';
	let loading = false;
	let error: string | null = null;
	let fullscreen = false;
	let panzoomInstance: any;
	let currentSrc = '';

	const zoomStep = 1.2;

	async function loadSvg() {
		if (!browser || !src) return;
		loading = true;
		error = null;
		try {
			const response = await fetch(src);
			if (!response.ok) {
				throw new Error(`Failed to load diagram (${response.status})`);
			}
			svgMarkup = await response.text();
			dispatch('components', { ids: extractComponentIds(svgMarkup) });
			await tick();
			initializePanzoom();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load diagram.';
		} finally {
			loading = false;
		}
	}

	function initializePanzoom() {
		if (!browser || !container) return;
		const svg = container.querySelector('svg');
		if (!svg) return;
		panzoomInstance?.dispose?.();
		panzoomInstance = panzoom(svg, {
			maxZoom: 10,
			minZoom: 0.2,
			bounds: false
		});
	}

	function centerPoint() {
		const rect = viewport?.getBoundingClientRect();
		return {
			x: rect ? rect.width / 2 : 0,
			y: rect ? rect.height / 2 : 0
		};
	}

	function zoomIn() {
		if (!panzoomInstance) return;
		const { x, y } = centerPoint();
		panzoomInstance.smoothZoom(x, y, zoomStep);
	}

	function zoomOut() {
		if (!panzoomInstance) return;
		const { x, y } = centerPoint();
		panzoomInstance.smoothZoom(x, y, 1 / zoomStep);
	}

	function resetView() {
		if (!panzoomInstance) return;
		panzoomInstance.moveTo(0, 0);
		panzoomInstance.zoomAbs(0, 0, 1);
	}

	async function toggleFullscreen() {
		if (!browser || !viewer) return;
		if (document.fullscreenElement) {
			await document.exitFullscreen();
			fullscreen = false;
		} else {
			await viewer.requestFullscreen();
			fullscreen = true;
		}
	}

	function handleClick(event: MouseEvent) {
		const target = event.target as Element | null;
		const link = target?.closest('a');
		if (!link) return;
		const rawHref = link.getAttribute('href') ?? link.getAttribute('xlink:href');
		if (!rawHref) return;
		const match = rawHref.match(/search\(['"]([^'"]+)['"]\)/);
		if (rawHref.startsWith('javascript:') && match?.[1]) {
			event.preventDefault();
			event.stopPropagation();
			dispatch('search', { id: match[1] });
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
			return;
		}
		switch (event.key) {
			case '+':
			case '=':
				zoomIn();
				break;
			case '-':
			case '_':
				zoomOut();
				break;
			case '0':
				resetView();
				break;
			case 'f':
			case 'F':
				toggleFullscreen();
				break;
		}
	}

	function handleFullscreenChange() {
		fullscreen = !!document.fullscreenElement;
	}

	onMount(() => {
		if (!browser) return;
		window.addEventListener('keydown', handleKeyDown);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
	});

	onDestroy(() => {
		panzoomInstance?.dispose?.();
		if (!browser) return;
		window.removeEventListener('keydown', handleKeyDown);
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
	});

	$: if (browser && src && src !== currentSrc) {
		currentSrc = src;
		loadSvg();
	}
</script>

<div class={`print-diagram flex w-full flex-col gap-2 ${dark ? 'text-slate-100' : 'text-slate-900'}`} style={`height: ${height};`} bind:this={viewer}>
	<div class="svg-controls no-print flex flex-wrap items-center gap-2">
		<div class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
			<button
				type="button"
				class="rounded px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-200 dark:hover:bg-slate-900"
				on:click={zoomIn}
				aria-label="Zoom in"
				title="Zoom in (+)"
			>
				+
			</button>
			<button
				type="button"
				class="rounded px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-200 dark:hover:bg-slate-900"
				on:click={zoomOut}
				aria-label="Zoom out"
				title="Zoom out (-)"
			>
				−
			</button>
			<button
				type="button"
				class="rounded px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-200 dark:hover:bg-slate-900"
				on:click={resetView}
				aria-label="Reset view"
				title="Reset view (0)"
			>
				Reset
			</button>
			<button
				type="button"
				class="rounded px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-200 dark:hover:bg-slate-900"
				on:click={toggleFullscreen}
				aria-label="Toggle fullscreen"
				title="Fullscreen (F)"
			>
				{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
			</button>
		</div>
		<div class="text-xs text-slate-400">
			Use mouse wheel/drag or pinch to zoom. Shortcuts: +, -, 0, F
		</div>
	</div>

	<div
		class={`relative flex-1 overflow-hidden rounded-xl border ${
			dark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
		} shadow-inner`}
		bind:this={viewport}
		on:click={handleClick}
	>
		{#if loading}
			<div class="flex h-full items-center justify-center">
				<Spinner label="Loading diagram" />
			</div>
		{:else if error}
			<div class="flex h-full items-center justify-center text-sm text-red-400">{error}</div>
		{:else}
			<div class="svg-viewer-content h-full w-full" bind:this={container}>
				{@html svgMarkup}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.svg-viewer-content svg) {
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	:global(.svg-viewer-content text) {
		user-select: none;
	}
</style>
