import type {
	ComponentsIndex,
	DiagramsIndex,
	ImagesIndex,
	InfoIndex,
	ModelTree,
	ModelsIndex
} from '@emdzej/wds-core';

const DATA_BASE_PATH = '/data';

const loadJson = async <T>(fetcher: typeof fetch, path: string): Promise<T> => {
	const response = await fetcher(`${DATA_BASE_PATH}/${path}`);

	if (!response.ok) {
		throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as T;
};

export const loadModelsIndex = (fetcher: typeof fetch): Promise<ModelsIndex> =>
	loadJson<ModelsIndex>(fetcher, 'models/index.json');

export const loadModelTree = (fetcher: typeof fetch, modelId: string): Promise<ModelTree> =>
	loadJson<ModelTree>(fetcher, `models/${modelId}/tree.json`);

export const loadDiagramsIndex = (fetcher: typeof fetch): Promise<DiagramsIndex> =>
	loadJson<DiagramsIndex>(fetcher, 'diagrams/index.json');

export const loadInfoIndex = (fetcher: typeof fetch): Promise<InfoIndex> =>
	loadJson<InfoIndex>(fetcher, 'info/index.json');

export const loadImagesIndex = (fetcher: typeof fetch): Promise<ImagesIndex> =>
	loadJson<ImagesIndex>(fetcher, 'images/index.json');

export const loadComponentsIndex = (fetcher: typeof fetch): Promise<ComponentsIndex> =>
	loadJson<ComponentsIndex>(fetcher, 'components/index.json');
