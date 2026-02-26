import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type HistoryItem = {
	type: 'diagram' | 'info';
	id: string;
	name: string;
	timestamp: number;
};

const STORAGE_KEY = 'wdsx-history';
const MAX_ITEMS = 20;

const loadHistory = (): HistoryItem[] => {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
};

const saveHistory = (items: HistoryItem[]) => {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		// Storage full or unavailable
	}
};

export const history = writable<HistoryItem[]>(loadHistory());

// Subscribe to changes and persist
history.subscribe((items) => {
	saveHistory(items);
});

export const addToHistory = (type: 'diagram' | 'info', id: string, name: string) => {
	history.update((items) => {
		// Remove existing entry for same item (to move it to top)
		const filtered = items.filter((item) => !(item.type === type && item.id === id));

		// Add new entry at the beginning
		const newItem: HistoryItem = {
			type,
			id,
			name,
			timestamp: Date.now()
		};

		// Keep only MAX_ITEMS
		return [newItem, ...filtered].slice(0, MAX_ITEMS);
	});
};

export const clearHistory = () => {
	history.set([]);
};
