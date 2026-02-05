import type { LayoutLoad } from './$types';
import { loadModelData } from '$lib/utils/data-loader';

export const load: LayoutLoad = async ({ fetch, params }) => {
	const model = await loadModelData(params.model, fetch);
	return { model };
};
