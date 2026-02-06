import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const basePath = process.env.BASE_PATH ?? '';

const collectPrerenderEntries = () => {
	const entries = new Set(['*']);
	try {
		const indexPath = resolve(__dirname, '../../data/models/index.json');
		const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
		for (const model of index.models ?? []) {
			if (!model?.id) continue;
			entries.add(`/${model.id}`);
			const modelPath = resolve(__dirname, `../../data/models/${model.id}.json`);
			const modelData = JSON.parse(readFileSync(modelPath, 'utf-8'));
			const diagramIds = new Set();
			const infoIds = new Set();

			const walk = (node) => {
				if (!node) return;
				if (node.diagram) diagramIds.add(node.diagram);
				if (node.info) infoIds.add(node.info);
				(node.children ?? []).forEach(walk);
			};

			walk(modelData.tree);
			diagramIds.forEach((id) => entries.add(`/${model.id}/diagram/${id}`));
			infoIds.forEach((id) => entries.add(`/${model.id}/info/${id}`));
		}
	} catch (error) {
		console.warn('Failed to collect prerender entries:', error);
	}

	return Array.from(entries);
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: basePath
		},
		prerender: {
			entries: collectPrerenderEntries(),
			handleHttpError: 'warn'
		}
	},
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;
