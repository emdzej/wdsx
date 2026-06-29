<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { getBass, startBassLifecycle } from '$lib/bass';

	let status = $state('Completing pairing…');
	let isError = $state(false);

	onMount(async () => {
		if (!browser) return;
		const bass = getBass();
		if (!bass) {
			status = 'Sync service URL not configured. Set it in Settings → Sync.';
			isError = true;
			return;
		}
		const ok = bass.completePairingFromUrl();
		if (!ok) {
			status = 'No tokens found in the callback URL — pairing failed.';
			isError = true;
			return;
		}
		status = 'Paired. Hydrating…';
		await startBassLifecycle();
		status = 'Paired. Redirecting…';
		// Popup flow: the library closed the popup already. Redirect flow: bounce home.
		if (!window.opener) {
			setTimeout(() => goto(resolve('/')), 400);
		}
	});
</script>

<div class="flex min-h-[60vh] items-center justify-center px-6">
	<p class="text-sm {isError ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}">
		{status}
	</p>
</div>
