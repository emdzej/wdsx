<script lang="ts">
	import { page } from '$app/stores';
</script>

<section class="space-y-4">
	<p class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
		Model
	</p>
	<h1 class="text-3xl font-semibold text-slate-900 dark:text-slate-100">{$page.params.model}</h1>
	<p class="max-w-2xl text-slate-600 dark:text-slate-300">
		Model-specific navigation will live here. Select a diagram or info section from the sidebar to
		get started.
	</p>
</section>
