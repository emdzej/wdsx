import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const getInitialTheme = (): 'light' | 'dark' => {
	if (!browser) return 'light';

	const stored = localStorage.getItem('theme');
	if (stored === 'dark' || stored === 'light') return stored;

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const theme = writable<'light' | 'dark'>(getInitialTheme());

export const initTheme = () => {
	if (!browser) return;

	const initial = getInitialTheme();
	theme.set(initial);
	document.documentElement.classList.toggle('dark', initial === 'dark');
};

export const toggleTheme = () => {
	if (!browser) return;

	theme.update((current) => {
		const next = current === 'dark' ? 'light' : 'dark';
		document.documentElement.classList.toggle('dark', next === 'dark');
		localStorage.setItem('theme', next);
		return next;
	});
};
