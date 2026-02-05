<script context="module" lang="ts">
	export type BreadcrumbItem = {
		label: string;
		href?: string;
	};
</script>

<script lang="ts">
	export let items: BreadcrumbItem[] = [];
</script>

<nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-slate-400">
	<ol class="flex flex-wrap items-center gap-2">
		{#each items as item, index}
			<li class="flex items-center gap-2">
				{#if item.href && index < items.length - 1}
					<a
						href={item.href}
						class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
					>
						{item.label}
					</a>
				{:else}
					<span
						class="font-semibold text-slate-800 dark:text-slate-100"
						aria-current={index === items.length - 1 ? 'page' : undefined}
					>
						{item.label}
					</span>
				{/if}
				{#if index < items.length - 1}
					<span class="text-slate-400 dark:text-slate-600">/</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
