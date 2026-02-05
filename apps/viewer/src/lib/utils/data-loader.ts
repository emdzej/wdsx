const DATA_BASE = '/data';

const normalizePath = (path: string) => path.replace(/^\/+/, '');

export type ModelIndexEntry = {
	id: string;
	name: string;
	file: string;
	treeSize: number;
	diagramCount: number;
	infoCount: number;
	icon?: string;
};

export type ModelIndex = {
	version: string;
	generated: string;
	sourceLanguage: string;
	models: ModelIndexEntry[];
};

export async function fetchJson<T>(path: string, fetchFn: typeof fetch = fetch): Promise<T> {
	const response = await fetchFn(`${DATA_BASE}/${normalizePath(path)}`);
	if (!response.ok) {
		throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
	}
	return (await response.json()) as T;
}

export async function fetchText(path: string, fetchFn: typeof fetch = fetch): Promise<string> {
	const response = await fetchFn(`${DATA_BASE}/${normalizePath(path)}`);
	if (!response.ok) {
		throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
	}
	return response.text();
}

export async function loadModelIndex(fetchFn: typeof fetch = fetch): Promise<ModelIndex> {
	return fetchJson<ModelIndex>('models/index.json', fetchFn);
}
