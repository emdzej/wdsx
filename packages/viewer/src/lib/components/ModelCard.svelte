<script lang="ts">
	import type { ModelMeta } from '@emdzej/wds-core';
	import { resolve } from '$app/paths';

	export let model: ModelMeta;
</script>

<a
	href={resolve(`/${model.id}/`)}
	class="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
>
	<div class="flex items-center gap-4">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
			aria-hidden="true"
		>
			{model.id.slice(0, 3).toUpperCase()}
		</div>
		<div>
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
				{model.id}
			</p>
			<h3
				class="mt-1 text-lg font-semibold text-slate-900 group-hover:text-slate-950 dark:text-slate-100"
			>
				{model.name}
			</h3>
		</div>
	</div>

	<div class="mt-6 grid grid-cols-2 gap-3 text-sm">
		<div class="rounded-xl bg-slate-50 p-3 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
			<p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Diagrams</p>
			<p class="mt-1 text-lg font-semibold">{model.diagramCount}</p>
		</div>
		<div class="rounded-xl bg-slate-50 p-3 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
			<p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Info pages</p>
			<p class="mt-1 text-lg font-semibold">{model.infoCount}</p>
		</div>
	</div>
</a>
