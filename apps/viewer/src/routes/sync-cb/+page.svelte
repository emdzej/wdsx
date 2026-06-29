<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { persistTokensFromHash } from '$lib/bass';

	let status = $state('Completing pairing…');
	let isError = $state(false);

	onMount(() => {
		if (!browser) return;
		const ok = persistTokensFromHash();
		if (!ok) {
			status = 'No tokens found in the callback URL — pairing failed.';
			isError = true;
			return;
		}
		// Strip the fragment so the tokens don't linger in the URL bar
		// or browser history.
		history.replaceState(null, '', location.pathname + location.search);
		status = 'Paired. Taking you back to wdsx…';
		// Full page navigation so the root layout re-initialises the
		// bass client with the now-saved tokens and runs hydrate +
		// seed (if requested) on a clean slate.
		setTimeout(() => {
			window.location.assign(resolve('/'));
		}, 200);
	});
</script>

<div class="flex min-h-[60vh] items-center justify-center px-6">
	<p class="text-sm {isError ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}">
		{status}
	</p>
</div>
