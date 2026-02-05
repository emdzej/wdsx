import type { LayoutLoad } from './$types';
import { error } from '@sveltejs/kit';
import { loadModelData } from '$lib/utils/data-loader';

export const load: LayoutLoad = async ({ fetch, params }) => {
	try {
		const model = await loadModelData(params.model, fetch);
		return { model };
	} catch (err) {
		throw error(404, err instanceof Error ? err.message : 'Model not found');
	}
};
