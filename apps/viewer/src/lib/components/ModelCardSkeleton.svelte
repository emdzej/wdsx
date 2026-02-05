<div class="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
	<div class="flex items-center gap-4">
		<div class="h-14 w-14 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
		<div class="flex-1 space-y-2">
			<div class="h-3 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
			<div class="h-5 w-32 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
			<div class="h-3 w-20 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
		</div>
	</div>
	<div class="grid grid-cols-2 gap-3 text-sm">
		{#each Array(2) as _}
			<div class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950">
				<div class="mx-auto h-5 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
				<div class="mx-auto mt-2 h-3 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
			</div>
		{/each}
	</div>
	<div class="mt-auto h-4 w-24 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
</div>
