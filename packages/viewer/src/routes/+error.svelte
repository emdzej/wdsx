<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	const toPathname = (path: string) => path as App.Pathname;
</script>

<section class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
	<div
		class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
	>
		Error {$page.status}
	</div>
	<h1 class="text-3xl font-semibold text-slate-900 dark:text-slate-100">
		{#if $page.status === 404}
			Page not found
		{:else}
			Something went wrong
		{/if}
	</h1>
	<p class="max-w-xl text-sm text-slate-600 dark:text-slate-300">
		{#if $page.status === 404}
			We couldn’t find the page you requested. Try going back to the dashboard or choose a model to
			continue browsing.
		{:else}
			An unexpected error occurred while loading this view. Please refresh the page or return to the
			start.
		{/if}
	</p>
	<div class="flex flex-wrap justify-center gap-3">
		<a
			href={resolve(toPathname('/'))}
			class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
		>
			Back to overview
		</a>
		<a
			href={resolve(toPathname('/models'))}
			class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
		>
			Browse models
		</a>
	</div>
</section>
