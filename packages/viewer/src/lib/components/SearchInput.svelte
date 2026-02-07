<script lang="ts">
	import { onMount } from 'svelte';

	let {
		value = $bindable(''),
		onSearch,
		placeholder = 'Search diagrams & info…',
		class: className = ''
	} = $props<{
		value?: string;
		onSearch?: (query: string) => void;
		placeholder?: string;
		class?: string;
	}>();

	let inputRef: HTMLInputElement | null = null;

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
		onSearch?.(value.trim());
	};

	onMount(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				inputRef?.focus();
				inputRef?.select();
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<form class={className} role="search" onsubmit={handleSubmit}>
	<div class="relative flex w-full items-center">
		<input
			bind:this={inputRef}
			type="search"
			bind:value
			{placeholder}
			class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-16 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/40"
			aria-label="Search"
		/>
		<span
			class="pointer-events-none absolute right-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
		>
			<kbd class="font-semibold">⌘</kbd>
			<kbd class="font-semibold">K</kbd>
			<span class="px-1 text-[9px] font-semibold">/</span>
			<kbd class="font-semibold">Ctrl</kbd>
			<kbd class="font-semibold">K</kbd>
		</span>
	</div>
</form>
