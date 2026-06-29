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
			// SPA shell — every URL is served this file by nginx and
			// SvelteKit's client router takes over.
			fallback: 'index.html'
		}),
		paths: {
			base: basePath,
			relative: false
		},
		prerender: {
			handleHttpError: ({ status, path }) => {
				// Ignore 404s for data files (not included in repo)
				if (status === 404 && path.startsWith('/data/')) {
					return;
				}
				throw new Error(`Prerender failed: ${status} ${path}`);
			},
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
