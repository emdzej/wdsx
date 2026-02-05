import type { PageLoad } from './$types';
import { loadModelIndex } from '$lib/utils/data-loader';

export const load: PageLoad = async ({ fetch }) => {
	const index = await loadModelIndex(fetch);
	return {
		models: index.models
	};
};
