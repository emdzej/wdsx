import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const LABEL_SCALE_KEY = 'wdsx-label-scale';
const DEFAULT_SCALE = 100;

// Load initial value from localStorage
const getInitialScale = (): number => {
	if (!browser) return DEFAULT_SCALE;
	try {
		const stored = localStorage.getItem(LABEL_SCALE_KEY);
		if (stored) {
			const value = parseInt(stored, 10);
			if (value >= 50 && value <= 200) return value;
		}
	} catch {
		// Ignore
	}
	return DEFAULT_SCALE;
};

// Label scale store (50-200%)
export const labelScale = writable<number>(getInitialScale());

// Persist changes to localStorage
if (browser) {
	labelScale.subscribe((value) => {
		try {
			localStorage.setItem(LABEL_SCALE_KEY, String(value));
		} catch {
			// Ignore
		}
	});
}
