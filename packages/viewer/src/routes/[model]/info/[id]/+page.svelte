<script lang="ts">
	import { page } from '$app/stores';
</script>

<section class="space-y-4">
	<p class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
		Info page
	</p>
	<h1 class="text-3xl font-semibold text-slate-900 dark:text-slate-100">
		{$page.params.id}
	</h1>
	<p class="max-w-2xl text-slate-600 dark:text-slate-300">
		Model {$page.params.model} information page content will render here in a future phase.
	</p>
</section>
