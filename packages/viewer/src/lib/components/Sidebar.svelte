<script lang="ts">
	import { resolve } from '$app/paths';

	let { open = false, onClose } = $props<{ open?: boolean; onClose?: () => void }>();

	const navigation = [
		{ label: 'Overview', href: '/' },
		{ label: 'Models', href: '/models' },
		{ label: 'Diagrams', href: '/diagrams' },
		{ label: 'Info Pages', href: '/info' }
	];

	const toPathname = (path: string) => path as App.Pathname;
</script>

<button
	type="button"
	class={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity md:hidden ${
		open ? 'opacity-100' : 'pointer-events-none opacity-0'
	}`}
	onclick={onClose}
	aria-label="Close navigation"
></button>

<aside
	class={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-lg transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 md:static md:translate-x-0 md:shadow-none ${
		open ? 'translate-x-0' : '-translate-x-full'
	}`}
>
	<div class="mb-6 px-2">
		<p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Navigation</p>
	</div>
	<nav class="flex-1 space-y-2">
		{#each navigation as item (item.href)}
			<a
				href={resolve(toPathname(item.href))}
				class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
			>
				{item.label}
			</a>
		{/each}
	</nav>
	<div
		class="mt-6 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
	>
		<p class="font-medium text-slate-600 dark:text-slate-300">Status</p>
		<p class="mt-1">Viewer shell ready for Phase 2.</p>
	</div>
</aside>
