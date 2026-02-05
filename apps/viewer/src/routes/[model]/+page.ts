import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { model } = await parent();
	return { model };
};
