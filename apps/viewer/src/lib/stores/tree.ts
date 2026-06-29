import { writable } from 'svelte/store';
import type { TreeNode } from '@emdzej/wds-core';

// Maps diagram/info ID to tree node name
export const diagramNames = writable<Map<string, string>>(new Map());
export const infoNames = writable<Map<string, string>>(new Map());

// Build maps from tree data
export const buildNameMaps = (root: TreeNode) => {
	const diagrams = new Map<string, string>();
	const infos = new Map<string, string>();

	const traverse = (node: TreeNode) => {
		if (node.diagram) {
			diagrams.set(node.diagram, node.name);
		}
		if (node.info) {
			infos.set(node.info, node.name);
		}
		node.children?.forEach(traverse);
	};

	traverse(root);
	diagramNames.set(diagrams);
	infoNames.set(infos);
};
