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
