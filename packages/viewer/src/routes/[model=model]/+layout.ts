import type { LayoutLoad } from './$types';
import { loadModelTree } from '$lib/data/loaders';

export const load: LayoutLoad = ({ fetch, params }) => {
	return {
		treePromise: loadModelTree(fetch, params.model)
	};
};
