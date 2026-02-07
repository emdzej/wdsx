<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';

	const formatSegment = (segment: string) =>
		segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

	const toPathname = (path: string) => path as App.Pathname;

	$: segments = $page.url.pathname.split('/').filter(Boolean);
	$: crumbs = segments.map((segment, index) => ({
		label: formatSegment(segment),
		href: `/${segments.slice(0, index + 1).join('/')}`
	}));
</script>

<nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-slate-400">
	<ol class="flex flex-wrap items-center gap-2">
		<li>
			<a
				href={resolve('/')}
				class="font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
			>
				Home
			</a>
		</li>
		{#each crumbs as crumb (crumb.href)}
			<li class="flex items-center gap-2">
				<span class="text-slate-400 dark:text-slate-600">/</span>
				<a
					href={resolve(toPathname(crumb.href))}
					class="font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
				>
					{crumb.label}
				</a>
			</li>
		{/each}
	</ol>
</nav>
