import { writable } from 'svelte/store';

// Store for tree search query (set by diagram clicks, consumed by layout)
export const treeSearchQuery = writable<string>('');

// Store for selected item - triggers tree expansion to this node
// Format: { type: 'diagram' | 'info', id: string }
export const selectedItem = writable<{ type: 'diagram' | 'info'; id: string } | null>(null);
