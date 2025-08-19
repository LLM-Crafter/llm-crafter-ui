import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class', // Enable class-based dark mode

	theme: {
		extend: {
			colors: {
				// Custom color palette
				gray: {
					50: '#f9fafb',
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af',
					500: '#6b7280',
					600: '#4b5563',
					700: '#374151',
					800: '#1f2937',
					900: '#111827',
					950: '#030712' // Added for darker backgrounds
				},
				blue: {
					400: '#60a5fa', // Lighter blue for links
					500: '#3b82f6', // Default blue
					600: '#2563eb', // Darker blue for buttons
					700: '#1d4ed8'
				},
				green: {
					400: '#4ade80', // Lighter green
					500: '#22c55e', // Default green
					600: '#16a34a', // Darker green for buttons
					700: '#15803d'
				},
				red: {
					400: '#f87171', // Lighter red
					500: '#ef4444', // Default red
					600: '#dc2626' // Darker red for logout
				}
			},
			borderRadius: {
				lg: '0.5rem' // Consistent rounded corners
			},
			boxShadow: {
				sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
				md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
				lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' // Used for cards
			}
		}
	},

	plugins: []
} satisfies Config;
