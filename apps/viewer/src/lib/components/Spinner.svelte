<script lang="ts">
	export let label = 'Loading';
	export let size = 'h-6 w-6';
</script>

<div class="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
	<span class={`inline-flex ${size} animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-slate-600`} aria-hidden="true"></span>
	<span>{label}</span>
</div>
