<script lang="ts">
	import { page } from '$app/stores';

	export let error: { message?: string };
	export let status: number;
</script>

<section class="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
	<div class="text-6xl font-semibold text-slate-300 dark:text-slate-700">{$page.status}</div>
	<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">
		{#if status === 404}
			Page not found
		{:else}
			Something went wrong
		{/if}
	</h1>
	<p class="text-sm text-slate-500 dark:text-slate-400">
		{#if status === 404}
			We couldn’t find what you were looking for. Try going back to the model list.
		{:else}
			{error?.message ?? 'An unexpected error occurred while loading this page.'}
		{/if}
	</p>
	<a
		href="/"
		class="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
	>
		Back to models
	</a>
</section>
