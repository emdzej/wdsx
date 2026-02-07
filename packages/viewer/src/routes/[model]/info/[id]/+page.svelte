<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { compile as mdsvexCompile } from 'mdsvex';
	import { compile as svelteCompile } from 'svelte/compiler';
	import type { ComponentType } from 'svelte';
	import type { InfoIndex, InfoPageMeta } from '@emdzej/wds-core';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let infoMeta = $state<InfoPageMeta | null>(null);
	let sections = $state<{ id: string; title: string; level: number }[]>([]);
	let MarkdownComponent = $state<ComponentType | null>(null);
	let markdownHost = $state<HTMLDivElement | null>(null);
	let loadCounter = 0;

	const infoId = $derived($page.params.id ?? '');
	const modelId = $derived($page.params.model ?? '');

	const slugify = (value: string): string => {
		return value
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	};

	const normalizeImagePaths = (markdown: string): string => {
		const withMarkdownImages = markdown.replace(
			/(!\[[^\]]*\]\()\/?(zi_images\/[^)]+)\)/gi,
			'$1/$2)'
		);
		return withMarkdownImages.replace(/src=["']\/?(zi_images\/[^"']+)["']/gi, 'src="/$1"');
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

	const toBase64 = (value: string): string => {
		return btoa(unescape(encodeURIComponent(value)));
	};

	const compileMarkdownComponent = async (markdown: string): Promise<ComponentType | null> => {
		const compiled = await mdsvexCompile(markdown, { extensions: ['.md'] });
		if (!compiled?.code) return null;
		const { js } = svelteCompile(compiled.code, { generate: 'client' });
		const moduleUrl = `data:text/javascript;base64,${toBase64(js.code)}`;
		const module = await import(/* @vite-ignore */ moduleUrl);
		return module.default ?? null;
	};

	const parseInfoLink = (href: string): string | null => {
		const match = href.match(/(?:^|\/)(?:S)?([A-Za-z0-9_-]+)\.html?$/i);
		return match?.[1] ?? null;
	};

	const parseDiagramLink = (href: string): string | null => {
		const match = href.match(/([A-Za-z0-9_-]+)\.svgz?$/i);
		return match?.[1] ?? null;
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
		MarkdownComponent = null;

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
			const prepared = buildMarkdownWithAnchors(markdown);
			sections = prepared.sections;
			MarkdownComponent = await compileMarkdownComponent(prepared.content);
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

<section class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				Info page
			</p>
			<h1 class="text-3xl font-semibold text-slate-900 dark:text-slate-100">
				{infoMeta?.title ?? infoId}
			</h1>
			{#if infoMeta?.title && infoMeta.title !== infoId}
				<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{infoId}</p>
			{/if}
		</div>
	</div>

	<div class="flex flex-col gap-8 lg:flex-row">
		{#if sections.length}
			<aside class="lg:w-64">
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
							<li
								class={section.level === 3 ? 'pl-4 text-sm text-slate-600 dark:text-slate-300' : ''}
							>
								<a href={`#${section.id}`} class="hover:text-sky-500">
									{section.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</aside>
		{/if}

		<div class="min-w-0 flex-1">
			{#if loading}
				<div
					class="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
				>
					Loading info page…
				</div>
			{:else if error}
				<div
					class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
				>
					{error}
				</div>
			{:else if MarkdownComponent}
				<div
					bind:this={markdownHost}
					class="info-markdown prose max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:prose-invert prose-slate"
				>
					<MarkdownComponent />
				</div>
			{:else}
				<div
					class="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
				>
					No content available.
				</div>
			{/if}
		</div>
	</div>
</section>

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
