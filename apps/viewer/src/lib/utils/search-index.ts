import { Document } from 'flexsearch';
import { fetchJson } from './data-loader';

export type SearchItemType = 'diagram' | 'info';

export type SearchItem = {
	key: string;
	type: SearchItemType;
	id: string;
	title: string;
	models: string[];
};

export type SearchResult = SearchItem & {
	matchField?: string;
};

type DiagramIndexEntry = {
	id: string;
	file: string;
	referencedBy?: { model: string; occurrences: number }[];
};

type DiagramIndex = {
	version: string;
	generated: string;
	diagrams: DiagramIndexEntry[];
};

type InfoIndexEntry = {
	id: string;
	title?: string;
	htmlFile: string;
	mdFile: string;
	sections: string[];
	referencedBy?: { model: string; occurrences: number }[];
};

type InfoIndex = {
	version: string;
	generated: string;
	pages: InfoIndexEntry[];
};

type SearchIndexState = {
	index: Document<SearchItem>;
	items: Map<string, SearchItem>;
};

const createIndex = () =>
	new Document<SearchItem>({
		document: {
			id: 'key',
			index: ['title', 'id', 'models'],
			store: ['key', 'type', 'id', 'title', 'models']
		},
		tokenize: 'forward'
	});

const normalizeModels = (referencedBy?: { model: string }[]) =>
	Array.from(new Set((referencedBy ?? []).map((entry) => entry.model).filter(Boolean)));

const toSearchItem = (type: SearchItemType, id: string, title: string, models: string[]): SearchItem => ({
	key: `${type}:${id}`,
	type,
	id,
	title,
	models
});

let indexPromise: Promise<SearchIndexState> | null = null;

async function buildSearchIndex(fetchFn: typeof fetch = fetch): Promise<SearchIndexState> {
	const [diagramIndex, infoIndex] = await Promise.all([
		fetchJson<DiagramIndex>('diagrams/index.json', fetchFn),
		fetchJson<InfoIndex>('info/index.json', fetchFn)
	]);

	const index = createIndex();
	const items = new Map<string, SearchItem>();

	for (const diagram of diagramIndex.diagrams) {
		const models = normalizeModels(diagram.referencedBy);
		const item = toSearchItem('diagram', diagram.id, diagram.id, models);
		index.add(item);
		items.set(item.key, item);
	}

	for (const page of infoIndex.pages) {
		const models = normalizeModels(page.referencedBy);
		const title = page.title ?? page.id;
		const item = toSearchItem('info', page.id, title, models);
		index.add(item);
		items.set(item.key, item);
	}

	return { index, items };
}

async function getSearchIndex(fetchFn: typeof fetch = fetch): Promise<SearchIndexState> {
	if (!indexPromise) {
		indexPromise = buildSearchIndex(fetchFn);
	}
	return indexPromise;
}

export type SearchFilters = {
	type?: SearchItemType;
	model?: string;
};

export async function search(
	query: string,
	options: { limit?: number; filters?: SearchFilters; fetchFn?: typeof fetch } = {}
): Promise<SearchResult[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const { index, items } = await getSearchIndex(options.fetchFn ?? fetch);
	const rawResults = index.search(trimmed, {
		limit: options.limit ?? 20,
		enrich: true
	}) as Array<{ field: string; result: Array<{ id: string; doc?: SearchItem }> }>;

	const merged = new Map<string, SearchResult>();

	for (const fieldResult of rawResults) {
		for (const hit of fieldResult.result) {
			const doc = hit.doc ?? items.get(hit.id as string);
			if (!doc || merged.has(doc.key)) continue;
			merged.set(doc.key, { ...doc, matchField: fieldResult.field });
		}
	}

	let results = Array.from(merged.values());
	if (options.filters?.type) {
		results = results.filter((item) => item.type === options.filters?.type);
	}
	if (options.filters?.model) {
		results = results.filter((item) => item.models.includes(options.filters!.model!));
	}

	return results;
}
