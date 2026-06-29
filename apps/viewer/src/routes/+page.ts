import type { PageLoad } from './$types';
import { loadModelsIndex } from '$lib/data/loaders';

export const load: PageLoad = (event) => {
	return {
		modelsPromise: loadModelsIndex(event.fetch)
	};
};
