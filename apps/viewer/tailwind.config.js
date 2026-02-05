/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

const config = {
	content: ['./src/**/*.{html,js,svelte,ts,svx,md}'],
	theme: {
		extend: {}
	},
	plugins: [typography]
};

export default config;
