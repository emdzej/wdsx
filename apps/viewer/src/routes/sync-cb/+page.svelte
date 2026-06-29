<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { getBass, seedFromLocalStorage, startBassLifecycle, takeSeedIntent } from '$lib/bass';

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
		// completePairingFromUrl() decides between popup-postMessage and
		// local-save based on `window.opener`. Chrome (and any flow that
		// preserves the opener relationship across a cross-origin
		// navigation) can leave it set even though we're in plain redirect
		// mode — which would silently post tokens to a phantom opener and
		// skip the localStorage save, leaving us stuck on "not paired".
		// Force the local path; we no longer support popup mode.
		try {
			(window as unknown as { opener: Window | null }).opener = null;
		} catch {
			/* opener is read-only in some sandboxed contexts; safe to ignore */
		}
		const ok = bass.completePairingFromUrl();
		if (!ok) {
			status = 'No tokens found in the callback URL — pairing failed.';
			isError = true;
			return;
		}
		status = 'Paired. Hydrating…';
		await startBassLifecycle();
		if (takeSeedIntent()) {
			const seeded = seedFromLocalStorage();
			if (seeded > 0) status = `Paired. Seeded ${seeded} setting${seeded === 1 ? '' : 's'}.`;
		}
		status = 'Paired. Redirecting…';
		setTimeout(() => goto(resolve('/')), 400);
	});
</script>

<div class="flex min-h-[60vh] items-center justify-center px-6">
	<p class="text-sm {isError ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}">
		{status}
	</p>
</div>
