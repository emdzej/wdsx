import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';

const mdsvexOptions = {
	extensions: ['.md']
};

const basePath = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [mdsvex(mdsvexOptions)],
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: basePath
		}
		// prerender: {
		// 	entries: ['*'],
		// 	handleHttpError: ({ status, path }) => {
		// 		if (status === 404 && path.startsWith('/data/')) {
		// 			return;
		// 		}
		// 		throw new Error(`Prerender request failed with ${status} for ${path}`);
		// 	},
		// 	handleUnseenRoutes: 'ignore'
		// }
	}
};

export default config;
