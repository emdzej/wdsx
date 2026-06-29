import { browser } from '$app/environment';
import { writable, derived, get } from 'svelte/store';

export interface FavoriteItem {
	type: 'diagram' | 'info';
	id: string;
	name: string;
	addedAt: number;
}

const STORAGE_KEY_PREFIX = 'wdsx-favorites:';

// Current model store (set by layout)
export const currentModelId = writable<string>('');

// All favorites indexed by model
const favoritesMap = writable<Map<string, FavoriteItem[]>>(new Map());

// Load favorites for a model from localStorage
const loadFavorites = (modelId: string): FavoriteItem[] => {
	if (!browser || !modelId) return [];
	try {
		const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${modelId}`);
		return stored ? (JSON.parse(stored) as FavoriteItem[]) : [];
	} catch {
		return [];
	}
};

// Save favorites for a model to localStorage
const saveFavorites = (modelId: string, items: FavoriteItem[]) => {
	if (!browser || !modelId) return;
	try {
		localStorage.setItem(`${STORAGE_KEY_PREFIX}${modelId}`, JSON.stringify(items));
	} catch {
		// Ignore localStorage errors
	}
};

// Derived store: favorites for current model
export const favorites = derived([currentModelId, favoritesMap], ([$modelId, $map]) => {
	if (!$modelId) return [];
	if (!$map.has($modelId)) {
		// Load from localStorage on first access
		const loaded = loadFavorites($modelId);
		if (loaded.length > 0) {
			$map.set($modelId, loaded);
		}
		return loaded;
	}
	return $map.get($modelId) ?? [];
});

// Check if an item is favorited
export const isFavorite = (type: 'diagram' | 'info', id: string): boolean => {
	const items = get(favorites);
	return items.some((item) => item.type === type && item.id === id);
};

// Create a derived store to check if specific item is favorite (reactive)
export const createIsFavoriteStore = (type: 'diagram' | 'info', id: string) => {
	return derived(favorites, ($favorites) =>
		$favorites.some((item) => item.type === type && item.id === id)
	);
};

// Add item to favorites
export const addFavorite = (type: 'diagram' | 'info', id: string, name: string) => {
	const modelId = get(currentModelId);
	if (!modelId) return;

	favoritesMap.update((map) => {
		const current = map.get(modelId) ?? loadFavorites(modelId);

		// Don't add duplicates
		if (current.some((item) => item.type === type && item.id === id)) {
			return map;
		}

		const updated = [...current, { type, id, name, addedAt: Date.now() }];
		map.set(modelId, updated);
		saveFavorites(modelId, updated);
		return new Map(map);
	});
};

// Remove item from favorites
export const removeFavorite = (type: 'diagram' | 'info', id: string) => {
	const modelId = get(currentModelId);
	if (!modelId) return;

	favoritesMap.update((map) => {
		const current = map.get(modelId) ?? [];
		const updated = current.filter((item) => !(item.type === type && item.id === id));
		map.set(modelId, updated);
		saveFavorites(modelId, updated);
		return new Map(map);
	});
};

// Toggle favorite status
export const toggleFavorite = (type: 'diagram' | 'info', id: string, name: string) => {
	if (isFavorite(type, id)) {
		removeFavorite(type, id);
	} else {
		addFavorite(type, id, name);
	}
};

// Initialize favorites for a model (call when model changes)
export const initFavorites = (modelId: string) => {
	currentModelId.set(modelId);

	// Ensure favorites are loaded
	favoritesMap.update((map) => {
		if (!map.has(modelId)) {
			const loaded = loadFavorites(modelId);
			if (loaded.length > 0) {
				map.set(modelId, loaded);
				return new Map(map);
			}
		}
		return map;
	});
};

// Export format
export interface FavoritesExport {
	version: 1;
	exportedAt: string;
	app: 'wdsx';
	favorites: Record<string, FavoriteItem[]>;
}

// Export all favorites from all models
export const exportAllFavorites = (): FavoritesExport => {
	if (!browser) {
		return { version: 1, exportedAt: new Date().toISOString(), app: 'wdsx', favorites: {} };
	}

	const allFavorites: Record<string, FavoriteItem[]> = {};

	// Scan localStorage for all favorites keys
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(STORAGE_KEY_PREFIX)) {
			const modelId = key.slice(STORAGE_KEY_PREFIX.length);
			try {
				const items = JSON.parse(localStorage.getItem(key) ?? '[]') as FavoriteItem[];
				if (items.length > 0) {
					allFavorites[modelId] = items;
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
		favorites: allFavorites
	};
};

// Import favorites (merge with existing)
export const importFavorites = (
	data: FavoritesExport,
	mode: 'merge' | 'replace' = 'merge'
): { imported: number; models: number } => {
	if (!browser || !data.favorites) {
		return { imported: 0, models: 0 };
	}

	let totalImported = 0;
	let modelsCount = 0;

	for (const [modelId, items] of Object.entries(data.favorites)) {
		if (!Array.isArray(items)) continue;

		const validItems = items.filter(
			(item) =>
				item &&
				typeof item.type === 'string' &&
				typeof item.id === 'string' &&
				typeof item.name === 'string'
		);

		if (validItems.length === 0) continue;

		modelsCount++;

		if (mode === 'replace') {
			// Replace: overwrite existing
			saveFavorites(modelId, validItems);
			totalImported += validItems.length;
		} else {
			// Merge: add only new items
			const existing = loadFavorites(modelId);
			const existingKeys = new Set(existing.map((e) => `${e.type}:${e.id}`));
			const newItems = validItems.filter((item) => !existingKeys.has(`${item.type}:${item.id}`));
			if (newItems.length > 0) {
				saveFavorites(modelId, [...existing, ...newItems]);
				totalImported += newItems.length;
			}
		}
	}

	// Refresh current model's favorites in store
	const modelId = get(currentModelId);
	if (modelId) {
		favoritesMap.update((map) => {
			map.set(modelId, loadFavorites(modelId));
			return new Map(map);
		});
	}

	return { imported: totalImported, models: modelsCount };
};
