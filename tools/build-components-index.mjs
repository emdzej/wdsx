import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const diagramIndexPath = join('apps', 'viewer', 'static', 'data', 'diagrams', 'index.json');
const diagramDir = join('apps', 'viewer', 'static', 'data', 'diagrams');
const outputDir = join('apps', 'viewer', 'static', 'data', 'components');
const outputPath = join(outputDir, 'index.json');

const COMPONENT_LINK_REGEX = /search\(['"]([^'"]+)['"]\)/g;

function extractComponentIds(svgMarkup) {
	const ids = new Set();
	let match = null;
	COMPONENT_LINK_REGEX.lastIndex = 0;
	while ((match = COMPONENT_LINK_REGEX.exec(svgMarkup))) {
		if (match[1]) ids.add(match[1]);
	}
	return Array.from(ids);
}

async function ensureDir(path) {
	await import('node:fs/promises').then(({ mkdir }) => mkdir(path, { recursive: true }));
}

const indexRaw = await readFile(diagramIndexPath, 'utf-8');
const diagramIndex = JSON.parse(indexRaw);
const diagrams = diagramIndex.diagrams ?? [];

const diagramModels = new Map();
for (const diagram of diagrams) {
	const models = (diagram.referencedBy ?? []).map((entry) => entry.model).filter(Boolean);
	diagramModels.set(diagram.id, models);
}

const componentMap = new Map();

let processed = 0;
for (const diagram of diagrams) {
	const svgPath = join(diagramDir, diagram.file);
	let svgMarkup = '';
	try {
		svgMarkup = await readFile(svgPath, 'utf-8');
	} catch {
		processed += 1;
		continue;
	}
	const componentIds = extractComponentIds(svgMarkup);
	for (const componentId of componentIds) {
		const perComponent = componentMap.get(componentId) ?? new Map();
		if (!perComponent.has(diagram.id)) {
			perComponent.set(diagram.id, diagramModels.get(diagram.id) ?? []);
		}
		componentMap.set(componentId, perComponent);
	}
	processed += 1;
	if (processed % 500 === 0) {
		console.log(`Processed ${processed}/${diagrams.length} diagrams...`);
	}
}

const components = Array.from(componentMap.entries())
	.map(([id, diagramsMap]) => ({
		id,
		diagrams: Array.from(diagramsMap.entries())
			.map(([diagramId, models]) => ({ id: diagramId, models }))
			.sort((a, b) => a.id.localeCompare(b.id))
	}))
	.sort((a, b) => a.id.localeCompare(b.id));

await ensureDir(outputDir);
await writeFile(
	outputPath,
	JSON.stringify(
		{
			version: '1.0.0',
			generated: new Date().toISOString(),
			components
		},
		null,
		2
	),
	'utf-8'
);

console.log(`Component index generated: ${outputPath} (components=${components.length})`);
