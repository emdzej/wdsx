<script lang="ts">
	import { page } from '$app/stores';
</script>

<section class="space-y-3">
	<h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Info: {$page.params.id}</h1>
	<p class="text-sm text-slate-500 dark:text-slate-400">Info viewer coming soon.</p>
	<a href={`/${$page.params.model}`} class="text-sm font-medium text-blue-600 dark:text-blue-400">← Back to model</a>
</section>
