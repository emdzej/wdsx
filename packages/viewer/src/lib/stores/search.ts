import { writable } from 'svelte/store';

// Store for tree search query (set by diagram clicks, consumed by layout)
export const treeSearchQuery = writable<string>('');
