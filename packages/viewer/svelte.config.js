import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';

const mdsvexOptions = {
	extensions: ['.md']
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [mdsvex(mdsvexOptions)],
	kit: {
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ status, path }) => {
				if (status === 404 && path.startsWith('/data/')) {
					return;
				}
				throw new Error(`Prerender request failed with ${status} for ${path}`);
			},
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
