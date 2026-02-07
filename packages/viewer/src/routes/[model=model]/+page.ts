import type { PageLoad } from './$types';
import { loadModelTree } from '$lib/data/loaders';

export const load: PageLoad = ({ fetch, params }) => {
	return {
		treePromise: loadModelTree(fetch, params.model)
	};
};
