<script lang="ts">
	import type { ModelData } from '$lib/utils/data-loader';

	let { data } = $props<{ model: ModelData }>();
</script>

<section class="space-y-4">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Model: {data.model.model}</h1>
		<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
			Browse wiring diagrams and service information using the tree navigation.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
			<div class="text-xs uppercase tracking-wide text-slate-400">Model ID</div>
			<div class="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{data.model.modelId}</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
			<div class="text-xs uppercase tracking-wide text-slate-400">Language</div>
			<div class="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{data.model.language}</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
			<div class="text-xs uppercase tracking-wide text-slate-400">Generated</div>
			<div class="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
				{new Date(data.model.generated).toLocaleString()}
			</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
			<div class="text-xs uppercase tracking-wide text-slate-400">Tree Size</div>
			<div class="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
				{data.model.tree?.children?.length ?? 0} top-level folders
			</div>
		</div>
	</div>

	<a href="/" class="text-sm font-medium text-blue-600 dark:text-blue-400">← Back to models</a>
</section>
