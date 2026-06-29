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
// Idempotent per (client instance) — safe to call from layout onMount.
export async function startBassLifecycle(): Promise<void> {
	const bass = getBass();
	if (!bass || lifecycleStarted) return;
	lifecycleStarted = true;
	if (!bass.isPaired()) return;
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

export const BASS_APP_ID = APP_ID;
