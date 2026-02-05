const DATA_BASE = '/data';

const normalizePath = (path: string) => path.replace(/^\/+/, '');

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
