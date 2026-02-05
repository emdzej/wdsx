export const COMPONENT_LINK_REGEX = /search\(['"]([^'"]+)['"]\)/g;

export function extractComponentIds(svgMarkup: string): string[] {
	const ids = new Set<string>();
	if (!svgMarkup) return [];
	let match: RegExpExecArray | null = null;
	COMPONENT_LINK_REGEX.lastIndex = 0;
	while ((match = COMPONENT_LINK_REGEX.exec(svgMarkup))) {
		if (match[1]) {
			ids.add(match[1]);
		}
	}
	return Array.from(ids).sort((a, b) => a.localeCompare(b));
}
