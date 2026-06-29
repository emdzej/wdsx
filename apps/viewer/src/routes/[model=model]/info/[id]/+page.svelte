<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { marked } from 'marked';
	import type {
		DiagramMeta,
		DiagramsIndex,
		InfoIndex,
		InfoPageMeta,
		ModelReference
	} from '@emdzej/wds-core';
	import { loadDiagramsIndex } from '$lib/data/loaders';
	import { favorites, toggleFavorite } from '$lib/stores/favorites';
	import { infoNames } from '$lib/stores/tree';
	import { addToHistory } from '$lib/stores/history';
	import AddToCollectionButton from '$lib/components/AddToCollectionButton.svelte';
	import DocumentMagnifier from '$lib/components/DocumentMagnifier.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let infoMeta = $state<InfoPageMeta | null>(null);
	let sections = $state<{ id: string; title: string; level: number }[]>([]);
	let htmlContent = $state<string>('');
	let markdownHost = $state<HTMLDivElement | null>(null);
	let loadCounter = 0;

	let diagramsIndex = $state<DiagramsIndex | null>(null);
	let relatedDiagramIds = $state<string[]>([]);
	let relatedDiagramRefs = $state<Map<string, ModelReference[]>>(new Map());

	const infoId = $derived($page.params.id ?? '');
	const modelId = $derived($page.params.model ?? '');
	const treeName = $derived($infoNames.get(infoId) ?? '');

	const getDiagramMeta = (id: string): DiagramMeta | undefined =>
		diagramsIndex?.diagrams.find((diagram) => diagram.id === id);

	const relatedDiagrams = $derived.by(() =>
		relatedDiagramIds.map((id) => ({
			id,
			meta: getDiagramMeta(id),
			references: relatedDiagramRefs.get(id) ?? []
		}))
	);

	const isFavorite = $derived(
		$favorites.some((item) => item.type === 'info' && item.id === infoId)
	);

	// Add to history when tree name is available
	$effect(() => {
		if (infoId && treeName) {
			addToHistory('info', infoId, treeName);
		}
	});

	const handleToggleFavorite = () => {
		toggleFavorite('info', infoId, treeName || infoId);
	};

	const slugify = (value: string): string => {
		return value
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	};

	const extractDiagramIds = (markdown: string): string[] => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local Set, not reactive
		const ids = new Set<string>();
		const hrefRegex = /href=["']([^"']+)["']/gi;
		const mdLinkRegex = /\]\(([^)]+)\)/g;
		const svgRegex = /([A-Za-z0-9_-]+)\.svgz?/gi;
		const fileRegex = /file=([A-Za-z0-9_-]+)\.htm/gi;
		const consider = (value: string) => {
			const diagram = parseDiagramLink(value);
			if (diagram) {
				ids.add(diagram);
			}
		};
		for (const match of markdown.matchAll(hrefRegex)) {
			consider(match[1]);
		}
		for (const match of markdown.matchAll(mdLinkRegex)) {
			consider(match[1]);
		}
		for (const match of markdown.matchAll(svgRegex)) {
			ids.add(match[1]);
		}
		for (const match of markdown.matchAll(fileRegex)) {
			ids.add(match[1]);
		}
		return Array.from(ids);
	};

	const normalizeImagePaths = (markdown: string): string => {
		// Rewrite zi_images/ → /data/zi_images/
		const withMarkdownImages = markdown.replace(
			/(!\[[^\]]*\]\()\/?(zi_images\/[^)]+)\)/gi,
			'$1/data/$2)'
		);
		return withMarkdownImages.replace(/src=["']\/?(zi_images\/[^"']+)["']/gi, 'src="/data/$1"');
	};

	const buildMarkdownWithAnchors = (markdown: string) => {
		const lines = markdown.split('\n');
		const ids: Record<string, number> = {};
		const pageSections: { id: string; title: string; level: number }[] = [];
		let inFence = false;

		const updated = lines.map((line) => {
			const trimmed = line.trim();
			if (trimmed.startsWith('```')) {
				inFence = !inFence;
				return line;
			}
			if (inFence) return line;
			const match = line.match(/^(#{2,3})\s+(.+)$/);
			if (!match) return line;
			const level = match[1].length;
			const title = match[2].replace(/\s+#+\s*$/, '').trim();
			let id = slugify(title);
			const current = (ids[id] ?? 0) + 1;
			ids[id] = current;
			if (current > 1) {
				id = `${id}-${current}`;
			}
			pageSections.push({ id, title, level });
			return `<h${level} id="${id}">${title}</h${level}>`;
		});

		return {
			content: updated.join('\n'),
			sections: pageSections
		};
	};

	const parseInfoLink = (href: string): string | null => {
		const match = href.match(/(?:^|\/)(?:S)?([A-Za-z0-9_-]+)\.html?$/i);
		return match?.[1] ?? null;
	};

	const parseDiagramLink = (href: string): string | null => {
		const fileMatch = href.match(/file=([A-Za-z0-9_-]+)\.htm/i);
		if (fileMatch) return fileMatch[1];
		const svgMatch = href.match(/([A-Za-z0-9_-]+)\.svgz?$/i);
		return svgMatch?.[1] ?? null;
	};

	const handleMarkdownClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement | null;
		const link = target?.closest('a') as HTMLAnchorElement | null;
		if (!link) return;

		const href = link.getAttribute('href') ?? '';
		if (!href || href.startsWith('#')) return;

		const infoTarget = parseInfoLink(href);
		if (infoTarget) {
			event.preventDefault();
			void goto(resolve(`/${modelId}/info/${infoTarget}`));
			return;
		}

		const diagramTarget = parseDiagramLink(href);
		if (diagramTarget) {
			event.preventDefault();
			void goto(resolve(`/${modelId}/diagram/${diagramTarget}`));
			return;
		}

		if (href.startsWith('http')) {
			event.preventDefault();
			window.open(href, '_blank', 'noopener');
		}
	};

	const loadInfoPage = async (id: string) => {
		const currentLoad = ++loadCounter;
		loading = true;
		error = null;
		infoMeta = null;
		sections = [];
		htmlContent = '';

		try {
			const indexResponse = await fetch('/data/info/index.json');
			if (!indexResponse.ok) {
				throw new Error('Failed to load info index');
			}
			const index = (await indexResponse.json()) as InfoIndex;
			const meta = index.pages.find((page) => page.id === id);
			if (!meta) {
				throw new Error(`Info page ${id} not found`);
			}
			infoMeta = meta;
			const mdFile = meta.mdFile ?? `${id}.md`;
			const mdResponse = await fetch(`/data/info/${mdFile}`);
			if (!mdResponse.ok) {
				throw new Error(`Failed to load info page ${mdFile}`);
			}
			const markdown = normalizeImagePaths(await mdResponse.text());
			if (currentLoad !== loadCounter) return;
			if (!diagramsIndex) {
				try {
					diagramsIndex = await loadDiagramsIndex(fetch);
				} catch (diagramError) {
					console.warn('Failed to load diagrams index', diagramError);
				}
			}
			const prepared = buildMarkdownWithAnchors(markdown);
			sections = prepared.sections;
			relatedDiagramIds = extractDiagramIds(markdown);
			relatedDiagramRefs = new Map(
				relatedDiagramIds.map((id) => [id, getDiagramMeta(id)?.referencedBy ?? []])
			);

			// Use marked to convert markdown to HTML
			htmlContent = await marked.parse(prepared.content);
		} catch (err) {
			if (currentLoad !== loadCounter) return;
			error = err instanceof Error ? err.message : 'Failed to load info page';
		} finally {
			if (currentLoad === loadCounter) {
				loading = false;
			}
		}
	};

	$effect(() => {
		if (!browser || !infoId) return;
		void loadInfoPage(infoId);
	});

	$effect(() => {
		if (!markdownHost) return;
		markdownHost.addEventListener('click', handleMarkdownClick);
		return () => markdownHost?.removeEventListener('click', handleMarkdownClick);
	});
</script>

<div class="flex h-full flex-col overflow-hidden print:block print:h-auto print:overflow-visible">
	<!-- Header -->
	<div class="pb-3 flex-shrink-0 flex items-start justify-between gap-3 print:hidden">
		<div class="min-w-0">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				Info
			</p>
			<h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
				{treeName || infoMeta?.title || infoId}
			</h1>
			<p class="text-xs text-slate-500 dark:text-slate-400 font-mono">{infoId}</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={handleToggleFavorite}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 {isFavorite
					? 'text-amber-500 hover:text-amber-600'
					: 'text-slate-400 hover:text-amber-500'}"
				type="button"
				title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
					/>
				</svg>
			</button>
			<AddToCollectionButton type="info" id={infoId} name={treeName || infoMeta?.title || infoId} />
			<button
				onclick={() => window.print()}
				class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 print:hidden"
				type="button"
				title="Print document"
			>
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 min-h-0 overflow-y-auto print:overflow-visible print:min-h-0">
		{#if loading}
			<div
				class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
			>
				<div class="space-y-4">
					<div class="skeleton-line w-1/3"></div>
					<div class="skeleton-line h-6 w-2/3"></div>
					<div class="space-y-2">
						<div class="skeleton-line"></div>
						<div class="skeleton-line w-11/12"></div>
						<div class="skeleton-line w-5/6"></div>
					</div>
				</div>
			</div>
		{:else if error}
			<div
				class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
			>
				{error}
			</div>
		{:else if htmlContent}
			<div class="flex gap-6">
				<!-- Main content -->
				<div
					bind:this={markdownHost}
					class="info-markdown wds-info-container prose max-w-none flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:prose-invert prose-slate"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- safe: rendered markdown from local files -->
					{@html htmlContent}
				</div>

				<!-- Sidebar (sections + related diagrams) -->
				{#if sections.length || relatedDiagrams.length}
					<aside
						class="w-56 flex-shrink-0 space-y-4 print:hidden sticky top-0 self-start max-h-[calc(100vh-8rem)] overflow-y-auto"
					>
						{#if sections.length}
							<div
								class="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
							>
								<p
									class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
								>
									Sections
								</p>
								<ul class="mt-3 space-y-2 text-slate-700 dark:text-slate-200">
									{#each sections as section (section.id)}
										<li class={section.level === 3 ? 'pl-3 text-xs text-slate-500' : 'text-sm'}>
											<a href={`#${section.id}`} class="hover:text-sky-500 truncate block">
												{section.title}
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if relatedDiagrams.length}
							<div
								class="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
							>
								<p
									class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
								>
									Diagrams
								</p>
								<ul class="mt-3 space-y-2">
									{#each relatedDiagrams.slice(0, 5) as diagram (diagram.id)}
										<li>
											<a
												href={resolve(`/${modelId}/diagram/${diagram.id}`)}
												class="text-sm text-slate-700 hover:text-sky-500 dark:text-slate-300 truncate block"
											>
												{diagram.meta?.title ?? diagram.id}
											</a>
										</li>
									{/each}
									{#if relatedDiagrams.length > 5}
										<li class="text-xs text-slate-400">
											+{relatedDiagrams.length - 5} more
										</li>
									{/if}
								</ul>
							</div>
						{/if}
					</aside>
				{/if}
			</div>
		{:else}
			<div
				class="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
			>
				No content available.
			</div>
		{/if}
	</div>

	<!-- Image magnifier for Alt+hover on images -->
	<DocumentMagnifier container={markdownHost} zoom={5} lensSize={300} />
</div>

<style>
	:global(.info-markdown table) {
		display: block;
		max-width: 100%;
		overflow-x: auto;
	}

	:global(.info-markdown table th),
	:global(.info-markdown table td) {
		white-space: nowrap;
	}

	:global(.info-markdown pre) {
		background-color: rgba(15, 23, 42, 0.05);
		border-radius: 0.75rem;
		padding: 1rem;
		overflow-x: auto;
	}

	:global(.dark .info-markdown pre) {
		background-color: rgba(15, 23, 42, 0.45);
	}
</style>
