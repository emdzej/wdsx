<script lang="ts">
	import { onMount } from 'svelte';

	let isDark = $state(false);

	const applyTheme = (value: boolean) => {
		isDark = value;

		if (typeof document !== 'undefined') {
			const root = document.documentElement;
			root.classList.toggle('dark', value);
			localStorage.setItem('theme', value ? 'dark' : 'light');
		}
	};

	const toggleTheme = () => {
		applyTheme(!isDark);
	};

	onMount(() => {
		const storedTheme = localStorage.getItem('theme');

		if (storedTheme) {
			applyTheme(storedTheme === 'dark');
			return;
		}

		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(prefersDark);
	});
</script>

<button
	type="button"
	class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
	onclick={toggleTheme}
	aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<span class="text-base" aria-hidden="true">
		{#if isDark}
			🌙
		{:else}
			☀️
		{/if}
	</span>
	<span class="hidden sm:inline">{isDark ? 'Dark' : 'Light'} mode</span>
</button>
