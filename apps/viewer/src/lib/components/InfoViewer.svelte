<script lang="ts">
	import MarkdownIt from 'markdown-it';

	export let markdown: string = '';

	let html = '';
	let sections: { id: string; title: string }[] = [];

	const md = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true
	});

	const normalizeMarkdown = (value: string) => value.replaceAll('/zi_images/', '/data/zi_images/');

	const slugify = (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');

	function renderMarkdown(source: string) {
		const normalized = normalizeMarkdown(source);
		const tokens = md.parse(normalized, {});
		const used = new Map<string, number>();
		sections = [];

		const getUniqueSlug = (value: string) => {
			const base = slugify(value);
			const count = used.get(base) ?? 0;
			used.set(base, count + 1);
			return count === 0 ? base : `${base}-${count}`;
		};

		for (let i = 0; i < tokens.length; i += 1) {
			const token = tokens[i];
			if (token.type === 'heading_open') {
				const title = tokens[i + 1]?.content ?? '';
				if (title) {
					const slug = getUniqueSlug(title);
					token.attrSet('id', slug);
					if (token.tag === 'h2') {
						sections = [...sections, { id: slug, title }];
					}
				}
			}
		}

		html = md.renderer.render(tokens, md.options, {});
	}

	$: renderMarkdown(markdown);
</script>

<section class="flex flex-col gap-6 lg:flex-row">
	{#if sections.length > 1}
		<aside class="lg:w-64 lg:shrink-0">
			<div class="sticky top-24 space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
				<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
					On this page
				</p>
				<nav>
					<ul class="space-y-2">
						{#each sections as section}
							<li>
								<a
									class="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
									href={`#${section.id}`}
								>
									{section.title}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			</div>
		</aside>
	{/if}

	<article class="prose prose-slate dark:prose-invert max-w-none">
		{@html html}
	</article>
</section>
