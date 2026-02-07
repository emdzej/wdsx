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
		adapter: adapter()
	}
};

export default config;
