<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { createCollapsible, createSwitch, melt } from '@melt-ui/svelte';

	let { children } = $props();

	const {
		elements: { root: sidebarRoot, trigger: sidebarTrigger, content: sidebarContent },
		states: { open: sidebarOpen },
		options: { forceVisible: forceSidebarVisible }
	} = createCollapsible({
		defaultOpen: false,
		forceVisible: false
	});

	const {
		elements: { root: darkRoot, input: darkInput },
		states: { checked: darkChecked }
	} = createSwitch({
		defaultChecked: false
	});

	onMount(() => {
		if (!browser) return;

		const stored = localStorage.getItem('wds-viewer-theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		darkChecked.set(stored ? stored === 'dark' : prefersDark);

		const media = window.matchMedia('(min-width: 768px)');
		const syncSidebar = () => forceSidebarVisible.set(media.matches);
		syncSidebar();
		media.addEventListener('change', syncSidebar);

		return () => {
			media.removeEventListener('change', syncSidebar);
		};
	});

	$effect(() => {
		if (!browser) return;
		const isDark = $darkChecked;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('wds-viewer-theme', isDark ? 'dark' : 'light');
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div use:melt={$sidebarRoot} class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<header class="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
		<div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<img src={favicon} alt="WDS Viewer" class="h-8 w-8" />
				<div>
					<div class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">BMW</div>
					<div class="text-lg font-semibold">WDS Viewer</div>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
					<label for="model-select" class="font-medium">Model</label>
					<select
						id="model-select"
						disabled
						class="rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900"
					>
						<option>Coming soon</option>
					</select>
				</div>
				<button
					use:melt={$sidebarTrigger}
					class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:hidden"
					type="button"
				>
					Menu
				</button>
				<button
					use:melt={$darkRoot}
					class="relative inline-flex h-9 w-16 items-center justify-start rounded-full border border-slate-200 bg-slate-100 p-1 transition dark:border-slate-700 dark:bg-slate-800"
					type="button"
					aria-label="Toggle dark mode"
				>
					<span
						class={`h-7 w-7 rounded-full bg-white shadow transition ${$darkChecked ? 'translate-x-6' : 'translate-x-0'} dark:bg-slate-950`}
					></span>
				</button>
				<input use:melt={$darkInput} />
			</div>
		</div>
	</header>

	{#if $sidebarOpen}
		<div
			class="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
			onclick={() => sidebarOpen.set(false)}
			aria-hidden="true"
		></div>
	{/if}

	<div class="mx-auto flex w-full max-w-6xl">
		<aside
			use:melt={$sidebarContent}
			class={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 shadow-lg transition md:static md:shadow-none dark:border-slate-800 dark:bg-slate-950 ${
				$sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
			}`}
		>
			<div class="flex items-center justify-between gap-2 md:hidden">
				<h2 class="text-sm font-semibold text-slate-500">Navigation</h2>
				<button
					class="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-200"
					onclick={() => sidebarOpen.set(false)}
					type="button"
				>
					Close
				</button>
			</div>
			<div class="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
				<div class="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center dark:border-slate-700">
					Tree navigation coming soon
				</div>
				<ul class="space-y-2">
					<li class="rounded-md bg-slate-100 px-3 py-2 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-100">
						Overview
					</li>
					<li class="px-3 py-2">Schemas</li>
					<li class="px-3 py-2">Components</li>
				</ul>
			</div>
		</aside>

		<main class="flex-1 px-4 py-6 md:px-8">
			<div class="mb-6">
				<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Viewer' }]} />
			</div>
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				{@render children()}
			</div>
		</main>
	</div>
</div>
