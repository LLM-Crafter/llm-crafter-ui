import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

// Get initial theme from localStorage or default to 'dark'
function getInitialTheme(): Theme {
	if (!browser) return 'dark';
	
	const stored = localStorage.getItem('theme') as Theme;
	if (stored) return stored;
	
	// Check system preference
	if (window.matchMedia('(prefers-color-scheme: light)').matches) {
		return 'light';
	}
	
	return 'dark';
}

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Subscribe to theme changes and update localStorage + document class
if (browser) {
	theme.subscribe((value) => {
		localStorage.setItem('theme', value);
		
		// Update document class for Tailwind dark mode
		if (value === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
	
	// Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', (e) => {
		// Only update if no theme is stored (user hasn't manually set a preference)
		if (!localStorage.getItem('theme')) {
			theme.set(e.matches ? 'dark' : 'light');
		}
	});
}

// Helper function to toggle theme
export function toggleTheme() {
	theme.update(current => current === 'dark' ? 'light' : 'dark');
}
