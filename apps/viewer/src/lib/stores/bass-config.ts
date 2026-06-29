import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const SERVICE_URL_KEY = 'wdsx-bass-service-url';

const readServiceUrl = (): string => {
	if (!browser) return '';
	return localStorage.getItem(SERVICE_URL_KEY) ?? '';
};

export const bassServiceUrl = writable<string>(readServiceUrl());

if (browser) {
	bassServiceUrl.subscribe((url) => {
		const trimmed = url.trim();
		if (trimmed) {
			localStorage.setItem(SERVICE_URL_KEY, trimmed);
		} else {
			localStorage.removeItem(SERVICE_URL_KEY);
		}
	});
}
