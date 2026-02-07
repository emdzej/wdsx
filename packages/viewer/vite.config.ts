import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['robots.txt', 'icons/icon.svg'],
			manifest: {
				name: 'WDS Viewer',
				short_name: 'WDS',
				description: 'BMW Wiring Diagram System viewer',
				theme_color: '#0f172a',
				background_color: '#0f172a',
				display: 'standalone',
				start_url: '.',
				scope: '.',
				icons: [
					{
						src: 'icons/icon.svg',
						sizes: 'any',
						type: 'image/svg+xml'
					}
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest}']
			}
		})
	],
	esbuild: {
		drop: ['console', 'debugger']
	}
});
