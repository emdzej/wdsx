/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
	content: ['./src/**/*.{html,js,svelte,ts,md}'],
	darkMode: 'class',
	theme: {
		extend: {}
	},
	plugins: [typography]
};
