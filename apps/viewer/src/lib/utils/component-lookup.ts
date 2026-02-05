import { fetchJson } from './data-loader';

export type ComponentDiagramUsage = {
	id: string;
	models: string[];
};

export type ComponentIndexEntry = {
	id: string;
	diagrams: ComponentDiagramUsage[];
};

export type ComponentIndex = {
	version: string;
	generated: string;
	components: ComponentIndexEntry[];
};

export type InfoIndexEntry = {
	id: string;
	title?: string;
	htmlFile: string;
	mdFile: string;
	sections: string[];
	referencedBy?: { model: string; occurrences: number }[];
};

export type InfoIndex = {
	version: string;
	generated: string;
	pages: InfoIndexEntry[];
};

let componentIndexPromise: Promise<ComponentIndex> | null = null;
let infoIndexPromise: Promise<InfoIndex> | null = null;

const normalizeModels = (references?: { model: string }[]) =>
	Array.from(new Set((references ?? []).map((entry) => entry.model).filter(Boolean)));

export async function loadComponentIndex(fetchFn: typeof fetch = fetch): Promise<ComponentIndex> {
	if (!componentIndexPromise) {
		componentIndexPromise = fetchJson<ComponentIndex>('components/index.json', fetchFn);
	}
	return componentIndexPromise;
}

export async function loadInfoIndex(fetchFn: typeof fetch = fetch): Promise<InfoIndex> {
	if (!infoIndexPromise) {
		infoIndexPromise = fetchJson<InfoIndex>('info/index.json', fetchFn);
	}
	return infoIndexPromise;
}

export async function findDiagramsForComponent(
	componentId: string,
	options: { fetchFn?: typeof fetch; preferModel?: string } = {}
): Promise<ComponentDiagramUsage[]> {
	const trimmed = componentId.trim();
	if (!trimmed) return [];
	const index = await loadComponentIndex(options.fetchFn ?? fetch);
	const entry = index.components.find((item) => item.id === trimmed);
	if (!entry) return [];
	const preferModel = options.preferModel;
	const sorted = [...entry.diagrams];
	if (preferModel) {
		sorted.sort((a, b) => {
			const aMatch = a.models.includes(preferModel) ? 0 : 1;
			const bMatch = b.models.includes(preferModel) ? 0 : 1;
			if (aMatch !== bMatch) return aMatch - bMatch;
			return a.id.localeCompare(b.id);
		});
	}
	return sorted;
}

export async function findInfoForComponents(
	componentIds: string[],
	options: { fetchFn?: typeof fetch; preferModel?: string } = {}
): Promise<Array<{ id: string; title: string; models: string[] }>> {
	const ids = componentIds.map((id) => id.trim()).filter(Boolean);
	if (!ids.length) return [];
	const index = await loadInfoIndex(options.fetchFn ?? fetch);
	const map = new Map(index.pages.map((page) => [page.id, page]));
	const preferModel = options.preferModel;
	const results = ids
		.map((id) => {
			const page = map.get(id);
			if (!page) return null;
			const models = normalizeModels(page.referencedBy);
			return {
				id: page.id,
				title: page.title ?? page.id,
				models
			};
		})
		.filter(Boolean) as Array<{ id: string; title: string; models: string[] }>;

	if (preferModel) {
		results.sort((a, b) => {
			const aMatch = a.models.includes(preferModel) ? 0 : 1;
			const bMatch = b.models.includes(preferModel) ? 0 : 1;
			if (aMatch !== bMatch) return aMatch - bMatch;
			return a.id.localeCompare(b.id);
		});
	} else {
		results.sort((a, b) => a.id.localeCompare(b.id));
	}

	return results;
}
