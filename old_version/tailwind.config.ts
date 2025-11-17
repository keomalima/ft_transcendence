import type { Config } from 'tailwindcss';

export default {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx,js,jsx,html}',
	],
	theme: {
		extend: {
			fontFamily: {
				inter: ['Inter', 'sans-serif'],
				calistoga: ['Calistoga', 'serif'],
			},
		},
	},
} satisfies Config;
