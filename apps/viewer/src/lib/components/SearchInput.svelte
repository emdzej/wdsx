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
			// Cmd/Ctrl+K
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				inputRef?.focus();
				inputRef?.select();
				return;
			}

			// "/" key (but not when typing in an input/textarea)
			if (event.key === '/' && !isEditableTarget(event.target)) {
				event.preventDefault();
				inputRef?.focus();
				inputRef?.select();
			}
		};

		const isEditableTarget = (target: EventTarget | null): boolean => {
			if (!target || !(target instanceof HTMLElement)) return false;
			const tagName = target.tagName.toLowerCase();
			return (
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select' ||
				target.isContentEditable
			);
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
			class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-12 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/40"
			aria-label="Search"
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					value = '';
					inputRef?.blur();
				}
			}}
		/>
		<kbd
			class="pointer-events-none absolute right-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
			>/</kbd
		>
	</div>
</form>
