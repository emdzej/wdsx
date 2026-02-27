<script lang="ts">
	import type { ModelMeta } from '@emdzej/wds-core';
	import { resolve } from '$app/paths';

	export let model: ModelMeta;

	// Card background image path
	const cardImagePath = `/data/models/${model.id}/card.png`;
</script>

<a
	href={resolve(`/${model.id}/`)}
	class="group relative flex h-40 items-end overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-800 dark:hover:border-slate-700"
>
	<!-- Background image (if exists) -->
	<div
		class="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
		style="background-image: url('{cardImagePath}')"
	></div>

	<!-- Gradient overlay for text readability -->
	<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

	<!-- Model name -->
	<div class="relative z-10 w-full p-4">
		<h3 class="text-xl font-semibold text-white drop-shadow-md">
			{model.name}
		</h3>
	</div>
</a>
