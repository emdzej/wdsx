import { browser } from '$app/environment';
import { writable, derived, get } from 'svelte/store';
import { currentModelId } from './favorites';

export interface CollectionItem {
	type: 'diagram' | 'info';
	id: string;
	name: string;
	addedAt: number;
}

export interface Collection {
	id: string;
	name: string;
	createdAt: number;
	items: CollectionItem[];
}

const STORAGE_KEY_PREFIX = 'wdsx-collections:';

// All collections indexed by model
const collectionsMap = writable<Map<string, Collection[]>>(new Map());

// Load collections for a model from localStorage
const loadCollections = (modelId: string): Collection[] => {
	if (!browser || !modelId) return [];
	try {
		const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${modelId}`);
		return stored ? (JSON.parse(stored) as Collection[]) : [];
	} catch {
		return [];
	}
};

// Save collections for a model to localStorage
const saveCollections = (modelId: string, collections: Collection[]) => {
	if (!browser || !modelId) return;
	try {
		localStorage.setItem(`${STORAGE_KEY_PREFIX}${modelId}`, JSON.stringify(collections));
	} catch {
		// Ignore localStorage errors
	}
};

// Derived store: collections for current model
export const collections = derived([currentModelId, collectionsMap], ([$modelId, $map]) => {
	if (!$modelId) return [];
	if (!$map.has($modelId)) {
		const loaded = loadCollections($modelId);
		if (loaded.length > 0) {
			$map.set($modelId, loaded);
		}
		return loaded;
	}
	return $map.get($modelId) ?? [];
});

// Generate unique ID
const generateId = () => Math.random().toString(36).slice(2, 10);

// Create a new collection
export const createCollection = (name: string): string => {
	const modelId = get(currentModelId);
	if (!modelId) return '';

	const id = generateId();
	const newCollection: Collection = {
		id,
		name: name.trim(),
		createdAt: Date.now(),
		items: []
	};

	collectionsMap.update((map) => {
		const current = map.get(modelId) ?? loadCollections(modelId);
		const updated = [...current, newCollection];
		map.set(modelId, updated);
		saveCollections(modelId, updated);
		return new Map(map);
	});

	return id;
};

// Delete a collection
export const deleteCollection = (collectionId: string) => {
	const modelId = get(currentModelId);
	if (!modelId) return;

	collectionsMap.update((map) => {
		const current = map.get(modelId) ?? [];
		const updated = current.filter((c) => c.id !== collectionId);
		map.set(modelId, updated);
		saveCollections(modelId, updated);
		return new Map(map);
	});
};

// Rename a collection
export const renameCollection = (collectionId: string, newName: string) => {
	const modelId = get(currentModelId);
	if (!modelId) return;

	collectionsMap.update((map) => {
		const current = map.get(modelId) ?? [];
		const updated = current.map((c) =>
			c.id === collectionId ? { ...c, name: newName.trim() } : c
		);
		map.set(modelId, updated);
		saveCollections(modelId, updated);
		return new Map(map);
	});
};

// Add item to a collection
export const addToCollection = (
	collectionId: string,
	type: 'diagram' | 'info',
	id: string,
	name: string
) => {
	const modelId = get(currentModelId);
	if (!modelId) return;

	collectionsMap.update((map) => {
		const current = map.get(modelId) ?? loadCollections(modelId);
		const updated = current.map((c) => {
			if (c.id !== collectionId) return c;

			// Don't add duplicates
			if (c.items.some((item) => item.type === type && item.id === id)) {
				return c;
			}

			return {
				...c,
				items: [...c.items, { type, id, name, addedAt: Date.now() }]
			};
		});
		map.set(modelId, updated);
		saveCollections(modelId, updated);
		return new Map(map);
	});
};

// Remove item from a collection
export const removeFromCollection = (
	collectionId: string,
	type: 'diagram' | 'info',
	id: string
) => {
	const modelId = get(currentModelId);
	if (!modelId) return;

	collectionsMap.update((map) => {
		const current = map.get(modelId) ?? [];
		const updated = current.map((c) => {
			if (c.id !== collectionId) return c;
			return {
				...c,
				items: c.items.filter((item) => !(item.type === type && item.id === id))
			};
		});
		map.set(modelId, updated);
		saveCollections(modelId, updated);
		return new Map(map);
	});
};

// Check if item is in any collection
export const getCollectionsContaining = (type: 'diagram' | 'info', id: string): Collection[] => {
	const allCollections = get(collections);
	return allCollections.filter((c) => c.items.some((item) => item.type === type && item.id === id));
};

// Initialize collections for a model
export const initCollections = (modelId: string) => {
	collectionsMap.update((map) => {
		if (!map.has(modelId)) {
			const loaded = loadCollections(modelId);
			if (loaded.length > 0) {
				map.set(modelId, loaded);
				return new Map(map);
			}
		}
		return map;
	});
};

// Export format
export interface CollectionsExport {
	version: 1;
	exportedAt: string;
	app: 'wdsx';
	type: 'collections';
	collections: Record<string, Collection[]>;
}

// Export all collections
export const exportAllCollections = (): CollectionsExport => {
	if (!browser) {
		return { version: 1, exportedAt: new Date().toISOString(), app: 'wdsx', type: 'collections', collections: {} };
	}

	const allCollections: Record<string, Collection[]> = {};

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(STORAGE_KEY_PREFIX)) {
			const modelId = key.slice(STORAGE_KEY_PREFIX.length);
			try {
				const items = JSON.parse(localStorage.getItem(key) ?? '[]') as Collection[];
				if (items.length > 0) {
					allCollections[modelId] = items;
				}
			} catch {
				// Skip invalid entries
			}
		}
	}

	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		app: 'wdsx',
		type: 'collections',
		collections: allCollections
	};
};

// Import collections
export const importCollections = (
	data: CollectionsExport,
	mode: 'merge' | 'replace' = 'merge'
): { imported: number; models: number } => {
	if (!browser || !data.collections) {
		return { imported: 0, models: 0 };
	}

	let totalImported = 0;
	let modelsCount = 0;

	for (const [modelId, importedCollections] of Object.entries(data.collections)) {
		if (!Array.isArray(importedCollections)) continue;

		const validCollections = importedCollections.filter(
			(c) => c && typeof c.id === 'string' && typeof c.name === 'string' && Array.isArray(c.items)
		);

		if (validCollections.length === 0) continue;

		modelsCount++;

		if (mode === 'replace') {
			saveCollections(modelId, validCollections);
			totalImported += validCollections.length;
		} else {
			const existing = loadCollections(modelId);
			const existingIds = new Set(existing.map((c) => c.id));
			const newCollections = validCollections.filter((c) => !existingIds.has(c.id));
			if (newCollections.length > 0) {
				saveCollections(modelId, [...existing, ...newCollections]);
				totalImported += newCollections.length;
			}
		}
	}

	// Refresh current model's collections in store
	const modelId = get(currentModelId);
	if (modelId) {
		collectionsMap.update((map) => {
			map.set(modelId, loadCollections(modelId));
			return new Map(map);
		});
	}

	return { imported: totalImported, models: modelsCount };
};
