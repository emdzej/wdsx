import { browser } from '$app/environment';
import { type BassClient, createBassClient } from '@emdzej/bass-client';
import { get } from 'svelte/store';
import { bassServiceUrl } from './stores/bass-config';

const APP_ID = 'wdsx';
// Sync the four wdsx-scoped key namespaces plus the un-prefixed `theme` key.
const SYNC_KEYS = ['wdsx-*', 'theme'];

let client: BassClient | null = null;
let clientUrl: string | null = null;
let lifecycleStarted = false;

export function getBass(): BassClient | null {
	if (!browser) return null;
	const url = get(bassServiceUrl).trim();
	if (!url) return null;
	if (client && clientUrl === url) return client;
	client = createBassClient({
		serviceUrl: url,
		appId: APP_ID,
		keys: SYNC_KEYS,
		debounceMs: 500
	});
	clientUrl = url;
	lifecycleStarted = false;
	return client;
}

export function resetBass(): void {
	client = null;
	clientUrl = null;
	lifecycleStarted = false;
}

// Hydrate from server, attach the localStorage proxy, open the WS channel.
// Idempotent per (client instance) — only locks after we confirm paired so
// callers can safely re-invoke it once the user finishes pairing.
export async function startBassLifecycle(): Promise<void> {
	if (!browser) return;
	const bass = getBass();
	if (!bass || lifecycleStarted) return;
	if (!bass.isPaired()) return;
	lifecycleStarted = true;

	try {
		await bass.hydrate({ timeoutMs: 2000 });
	} catch (err) {
		console.warn('bass.hydrate failed', err);
	}
	bass.attachLocalStorageProxy();
	try {
		await bass.startNotifications();
	} catch (err) {
		console.warn('bass.startNotifications failed', err);
	}
}

// One-shot push of pre-existing wdsx keys to bass. Bass only sees writes
// that go through the proxy after it's attached — pre-existing values would
// otherwise stay invisible to the sync service. Best called after
// startBassLifecycle() so the server's values win for any overlapping keys.
//
// Idempotent per device id via a non-synced flag (underscores so it doesn't
// match the `wdsx-*` glob). Returns the number of keys queued for push.
export function seedFromLocalStorage(): number {
	if (!browser) return 0;
	const bass = getBass();
	if (!bass) return 0;
	const state = bass.authState();
	if (!state.isPaired || !state.deviceId) return 0;
	const flagKey = `wdsx_bass_seeded_${state.deviceId}`;
	if (localStorage.getItem(flagKey)) return 0;

	let count = 0;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key) continue;
		if (!(key.startsWith('wdsx-') || key === 'theme')) continue;
		const value = localStorage.getItem(key);
		if (value === null) continue;
		void bass.set(key, value);
		count++;
	}
	localStorage.setItem(flagKey, '1');
	return count;
}

// Parse the OIDC redirect fragment ourselves and write the token blob
// straight into the localStorage slot the bass client reads from. We
// bypass bass-client's completePairingFromUrl() — its detection of
// "popup mode" via window.opener fires false positives in both Chrome
// and Safari when wdsx is loaded behind an auth-proxy that chains
// redirects (the opener relationship survives the cross-origin
// navigation), and the function silently posts tokens to a phantom
// opener instead of saving them locally.
//
// The token key + JSON shape mirror bass-client's TokenStore (see
// packages/client/src/storage/tokens.ts) so a freshly constructed
// BassClient picks them up.
export function persistTokensFromHash(): boolean {
	if (!browser) return false;
	const frag = window.location.hash.replace(/^#/, '');
	if (!frag) return false;
	const params = new URLSearchParams(frag);
	const sync = params.get('sync_token');
	const refresh = params.get('refresh_token');
	const deviceId = params.get('device_id');
	const expiresIn = Number(params.get('expires_in') ?? '0');
	if (!sync || !refresh || !deviceId || !expiresIn) return false;
	const tokenSet = {
		deviceId,
		syncToken: sync,
		refreshToken: refresh,
		expiresAt: Date.now() + expiresIn * 1000
	};
	localStorage.setItem(`__bass_tokens__:${APP_ID}`, JSON.stringify(tokenSet));
	return true;
}

// Persisted across the OIDC redirect via sessionStorage so the /sync-cb
// route knows whether the user opted into seeding when they clicked Pair.
const SEED_INTENT_KEY = 'wdsx_bass_seed_on_pair';

export function setSeedIntent(value: boolean): void {
	if (!browser) return;
	if (value) sessionStorage.setItem(SEED_INTENT_KEY, '1');
	else sessionStorage.removeItem(SEED_INTENT_KEY);
}

export function takeSeedIntent(): boolean {
	if (!browser) return false;
	const v = sessionStorage.getItem(SEED_INTENT_KEY);
	sessionStorage.removeItem(SEED_INTENT_KEY);
	return v === '1';
}

export const BASS_APP_ID = APP_ID;
