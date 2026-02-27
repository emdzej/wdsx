<script lang="ts">
	/**
	 * Document-level image magnifier.
	 * Shows a magnifying lens when hovering over any <img> inside the container
	 * while holding Alt/Option key.
	 */

	interface Props {
		container: HTMLElement | null;
		zoom?: number;
		lensSize?: number;
	}

	let { container, zoom = 2.5, lensSize = 150 }: Props = $props();

	let visible = $state(false);
	let pos = $state({ x: 0, y: 0 });
	let bgPos = $state('0% 0%');
	let currentSrc = $state('');

	const handleMouseMove = (e: MouseEvent) => {
		if (!container) return;

		// Check if hovering over an image
		const target = e.target as HTMLElement;
		const img = target.closest('img') as HTMLImageElement | null;

		if (!img || !e.altKey) {
			visible = false;
			return;
		}

		// Make sure image is inside our container
		if (!container.contains(img)) {
			visible = false;
			return;
		}

		const rect = img.getBoundingClientRect();
		const rx = e.clientX - rect.left;
		const ry = e.clientY - rect.top;

		// Check if cursor is actually over the image
		if (rx < 0 || ry < 0 || rx > rect.width || ry > rect.height) {
			visible = false;
			return;
		}

		const px = rx / rect.width;
		const py = ry / rect.height;

		pos = { x: e.clientX, y: e.clientY };
		currentSrc = img.src;

		// Background position for zoomed image
		const bx = Math.max(0, Math.min(100, px * 100));
		const by = Math.max(0, Math.min(100, py * 100));
		bgPos = `${bx}% ${by}%`;
		visible = true;
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Alt') {
			visible = false;
		}
	};

	$effect(() => {
		if (!container) return;

		window.addEventListener('mousemove', handleMouseMove, true);
		window.addEventListener('keyup', handleKeyUp, true);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove, true);
			window.removeEventListener('keyup', handleKeyUp, true);
		};
	});
</script>

{#if visible && currentSrc}
	<div
		class="magnifier-lens"
		style:left="{pos.x - lensSize / 2}px"
		style:top="{pos.y - lensSize / 2}px"
		style:width="{lensSize}px"
		style:height="{lensSize}px"
		style:background-image="url('{currentSrc}')"
		style:background-size="{zoom * 100}%"
		style:background-position={bgPos}
	></div>
{/if}

<style>
	.magnifier-lens {
		position: fixed;
		border-radius: 50%;
		pointer-events: none;
		background-repeat: no-repeat;
		box-shadow:
			0 0 0 3px rgba(255, 255, 255, 0.9),
			0 8px 24px rgba(0, 0, 0, 0.3);
		z-index: 9999;
		transform: translateZ(0);
	}
</style>
