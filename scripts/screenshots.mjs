/**
 * Capture screenshots of WDS Viewer features using Playwright.
 *
 * Usage:
 *   1. Import data & build:  pnpm build
 *   2. Run this script:      node scripts/screenshots.mjs
 *
 * Or use the shortcut:       pnpm screenshots
 *
 * Outputs PNGs to docs/screenshots/{light,dark}/
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'docs', 'screenshots');
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const VIEWPORT = { width: 1440, height: 900 };

// Known model & content IDs (from imported e46 data)
const MODEL = 'e46';
const DIAGRAM_ID = 'SP0000014320';
const INFO_ID = 'CT0100FB1214_CAN';
// Tree node IDs to expand so the tree looks populated
const TREE_EXPANDED = [
	'root',
	'root-0',
	'root-0-0',
	'root-0-0-0',
	'root-0-0-0-0',
	'root-0-0-0-0-1',
	'root-0-0-0-0-1-0'
];

mkdirSync(resolve(OUT, 'light'), { recursive: true });
mkdirSync(resolve(OUT, 'dark'), { recursive: true });

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function shot(theme, name) {
	return resolve(OUT, theme, `${name}.png`);
}

/** Wait for the server to respond */
async function waitForServer(url, timeoutMs = 30000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {}
		await sleep(500);
	}
	throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

/** Start dev server, return a kill function */
function startPreview() {
	const proc = spawn('pnpm', ['run', 'dev', '--port', '5173'], {
		cwd: resolve(__dirname, '..', 'apps', 'viewer'),
		stdio: 'ignore',
		shell: true
	});
	const kill = () => proc.kill('SIGTERM');
	proc.on('error', (e) => console.error('Dev server error:', e));
	return kill;
}

/** Seed localStorage so tree is expanded and dropdowns have content */
async function seedData(page) {
	await page.evaluate(
		({ model, expanded }) => {
			const now = Date.now();

			// Expand tree nodes (key: wds-viewer-tree:<model>)
			localStorage.setItem(`wds-viewer-tree:${model}`, JSON.stringify(expanded));

			// Seed history (key: wdsx-history, type: HistoryItem[])
			const history = [
				{
					type: 'diagram',
					id: 'SP0000014320',
					name: 'Engine management, signals/auxiliary signals',
					timestamp: now
				},
				{
					type: 'info',
					id: 'CT0100FB1214_CAN',
					name: 'CAN-Bus (M3_S54_COUPE or M3_S54_CONV)',
					timestamp: now - 60000
				},
				{
					type: 'info',
					id: 'CT0100FB1214_NWG',
					name: 'Camshaft Sensor (DME Motor Electronics MSS54)',
					timestamp: now - 120000
				}
			];
			localStorage.setItem('wdsx-history', JSON.stringify(history));

			// Seed favorites (key: wdsx-favorites:<model>, type: FavoriteItem[])
			const favorites = [
				{
					type: 'diagram',
					id: 'SP0000014320',
					name: 'Engine management, signals/auxiliary signals',
					addedAt: now
				},
				{
					type: 'info',
					id: 'CT0100FB1214_CAN',
					name: 'CAN-Bus (M3_S54_COUPE or M3_S54_CONV)',
					addedAt: now - 30000
				}
			];
			localStorage.setItem(`wdsx-favorites:${model}`, JSON.stringify(favorites));

			// Seed collections (key: wdsx-collections:<model>, type: Collection[])
			const collections = [
				{
					id: 'engine-diag',
					name: 'Engine Diagnostics',
					createdAt: now,
					items: [
						{
							type: 'diagram',
							id: 'SP0000014320',
							name: 'Engine management, signals/auxiliary signals',
							addedAt: now
						},
						{
							type: 'info',
							id: 'CT0100FB1214_NWG',
							name: 'Camshaft Sensor (DME MSS54)',
							addedAt: now
						}
					]
				},
				{
					id: 'can-bus',
					name: 'CAN Bus Reference',
					createdAt: now,
					items: [
						{
							type: 'info',
							id: 'CT0100FB1214_CAN',
							name: 'CAN-Bus (M3_S54)',
							addedAt: now
						}
					]
				}
			];
			localStorage.setItem(`wdsx-collections:${model}`, JSON.stringify(collections));
		},
		{ model: MODEL, expanded: TREE_EXPANDED }
	);
}

async function captureTheme(browser, colorScheme) {
	const theme = colorScheme;
	const context = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: 2,
		colorScheme
	});
	const page = await context.newPage();

	const settle = (ms = 1500) => page.waitForTimeout(ms);

	// Seed localStorage before navigating
	await page.goto(BASE);
	await seedData(page);

	// --- 01: Home — Model Selection ---
	console.log(`  [${theme}] Home — model selection...`);
	await page.goto(BASE);
	await page.waitForSelector('.grid, [class*="border-dashed"]', { timeout: 10_000 });
	await settle();
	await page.screenshot({ path: shot(theme, '01-home-model-selection') });

	// --- 02: Header ---
	console.log(`  [${theme}] Header...`);
	const header = page.locator('header');
	if (await header.isVisible()) {
		await header.screenshot({ path: shot(theme, '02-header') });
	}

	// --- 03: Model page — Tree navigation (with expanded nodes) ---
	console.log(`  [${theme}] Model page — tree navigation...`);
	await page.goto(`${BASE}/${MODEL}/`);
	await settle(2000);
	await page.screenshot({ path: shot(theme, '03-model-tree-navigation') });

	// --- 04: Diagram viewer ---
	console.log(`  [${theme}] Diagram viewer...`);
	await page.goto(`${BASE}/${MODEL}/diagram/${DIAGRAM_ID}`);
	await settle(2000);
	await page.screenshot({ path: shot(theme, '04-diagram-viewer') });

	// --- 05: Info page ---
	console.log(`  [${theme}] Info page...`);
	await page.goto(`${BASE}/${MODEL}/info/${INFO_ID}`);
	await settle(2000);
	await page.screenshot({ path: shot(theme, '05-info-page') });

	// --- 06: Search (tree search on model page) ---
	console.log(`  [${theme}] Search...`);
	await page.goto(`${BASE}/${MODEL}/`);
	await settle(1000);
	const searchInput = page.locator('input[placeholder*="Search"]');
	if (await searchInput.isVisible()) {
		await searchInput.click();
		await searchInput.fill('engine');
		await settle(500);
	}
	await page.screenshot({ path: shot(theme, '06-search') });

	// --- Header dropdowns (07–10) — target by title attribute ---
	// Navigate to model page first so all model-dependent buttons are rendered
	// Then capture each dropdown by fresh navigation to model page

	// 07: History
	console.log(`  [${theme}] History dropdown...`);
	await page.goto(`${BASE}/${MODEL}/`);
	await settle(1000);
	const historyBtn = page.locator('button[title="Recently viewed"]');
	if (await historyBtn.count()) {
		await historyBtn.click();
		await settle(500);
		await page.screenshot({ path: shot(theme, '07-history-dropdown') });
	} else {
		console.log(`    skipped — button not found`);
	}

	// 08: Favorites — rendered only when currentModelId store is set
	// The model layout $effect sets it via initFavorites; use SPA navigation to trigger it
	console.log(`  [${theme}] Favorites dropdown...`);
	await page.goto(BASE);
	await settle(1000);
	// Click model card to navigate via SPA routing
	const modelCard = page.locator(`.grid a[href*="/${MODEL}"]`).first();
	if (await modelCard.isVisible({ timeout: 3000 }).catch(() => false)) {
		await modelCard.click();
		await settle(2000);
	} else {
		await page.goto(`${BASE}/${MODEL}/`);
		await settle(2000);
	}
	const favBtn = page.locator('button[title="Favorites"]');
	await favBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
	if (await favBtn.count() && await favBtn.isVisible()) {
		await favBtn.click();
		await settle(500);
		await page.screenshot({ path: shot(theme, '08-favorites-dropdown') });
	} else {
		console.log(`    skipped — button not found`);
	}

	// 09: Collections
	console.log(`  [${theme}] Collections dropdown...`);
	await page.goto(`${BASE}/${MODEL}/`);
	await settle(1000);
	const collBtn = page.locator('button[title="Collections"]');
	if (await collBtn.count()) {
		await collBtn.click();
		await settle(500);
		await page.screenshot({ path: shot(theme, '09-collections-dropdown') });
	} else {
		console.log(`    skipped — button not found`);
	}

	// 10: Settings
	console.log(`  [${theme}] Settings dropdown...`);
	await page.goto(`${BASE}/${MODEL}/`);
	await settle(1000);
	const setBtn = page.locator('button[title="Settings"]');
	if (await setBtn.count()) {
		await setBtn.click();
		await settle(500);
		await page.screenshot({ path: shot(theme, '10-settings-dropdown') });
	} else {
		console.log(`    skipped — button not found`);
	}

	// --- 11: Dark mode overview (dark only) ---
	if (theme === 'dark') {
		console.log(`  [${theme}] Dark mode overview...`);
		await page.goto(`${BASE}/${MODEL}/`);
		await settle(2000);
		await page.screenshot({ path: shot(theme, '11-dark-mode') });
	}

	await context.close();
}

(async () => {
	console.log('Starting preview server...');
	const killPreview = startPreview();
	await waitForServer(BASE);

	try {
		const browser = await chromium.launch();

		console.log('\nCapturing light theme...');
		await captureTheme(browser, 'light');

		console.log('\nCapturing dark theme...');
		await captureTheme(browser, 'dark');

		await browser.close();
		console.log(`\nAll screenshots saved to docs/screenshots/`);
	} finally {
		killPreview();
	}
})();
