// Theme Manager for TileDash
// Handles dynamic theme switching at runtime

export type ThemeName = 'light' | 'dark' | 'tiledash' | 'smooth-light' | 'smooth-dark';

export interface ThemeConfig {
	name: ThemeName;
	displayName: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		surface: string;
		text: string;
		textSecondary: string;
		border: string;
		shadow: string;
		// Tile specific colors
		tileBackground: string;
		tileBackgroundOff: string;
		tileShadow: string;
		// Interactive colors
		success: string;
		warning: string;
		error: string;
		info: string;
	};
}

export const themes: Record<ThemeName, ThemeConfig> = {
	light: {
		name: 'light',
		displayName: 'Light Theme',
		colors: {
			primary: '#1976d2',
			secondary: '#424242',
			accent: '#ff4081',
			background: '#fafafa',
			surface: '#ffffff',
			text: '#212121',
			textSecondary: '#757575',
			border: '#e0e0e0',
			shadow: 'rgba(0, 0, 0, 0.1)',
			tileBackground: '#ffffff',
			tileBackgroundOff: 'rgba(255, 255, 255, 0.6)',
			tileShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
			success: '#4caf50',
			warning: '#ff9800',
			error: '#f44336',
			info: '#2196f3',
		},
	},
	dark: {
		name: 'dark',
		displayName: 'Dark Theme',
		colors: {
			primary: '#90caf9',
			secondary: '#b0b0b0',
			accent: '#f48fb1',
			background: '#121212',
			surface: '#1e1e1e',
			text: '#ffffff',
			textSecondary: '#b0b0b0',
			border: '#333333',
			shadow: 'rgba(0, 0, 0, 0.3)',
			tileBackground: '#1e1e1e',
			tileBackgroundOff: 'rgba(30, 30, 30, 0.6)',
			tileShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
			success: '#66bb6a',
			warning: '#ffb74d',
			error: '#ef5350',
			info: '#42a5f5',
		},
	},
	tiledash: {
		name: 'tiledash',
		displayName: 'TileDash Classic',
		colors: {
			primary: '#ff6b35',
			secondary: '#2d3436',
			accent: '#00b894',
			background: '#ddd',
			surface: '#ffffff',
			text: '#2d3436',
			textSecondary: '#636e72',
			border: '#b2bec3',
			shadow: 'rgba(0, 0, 0, 0.15)',
			tileBackground: '#ffffff',
			tileBackgroundOff: 'rgba(255, 255, 255, 0.65)',
			tileShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
			success: '#00b894',
			warning: '#fdcb6e',
			error: '#e84393',
			info: '#74b9ff',
		},
	},
	'smooth-light': {
		name: 'smooth-light',
		displayName: 'Smooth Light',
		colors: {
			primary: '#667eea',
			secondary: '#4a5568',
			accent: '#ed8936',
			background: '#f7fafc',
			surface: '#ffffff',
			text: '#2d3748',
			textSecondary: '#718096',
			border: '#e2e8f0',
			shadow: 'rgba(0, 0, 0, 0.05)',
			tileBackground: '#ffffff',
			tileBackgroundOff: 'rgba(255, 255, 255, 0.7)',
			tileShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
			success: '#48bb78',
			warning: '#ed8936',
			error: '#f56565',
			info: '#4299e1',
		},
	},
	'smooth-dark': {
		name: 'smooth-dark',
		displayName: 'Smooth Dark',
		colors: {
			primary: '#9f7aea',
			secondary: '#a0aec0',
			accent: '#f6ad55',
			background: '#1a202c',
			surface: '#2d3748',
			text: '#f7fafc',
			textSecondary: '#cbd5e0',
			border: '#4a5568',
			shadow: 'rgba(0, 0, 0, 0.25)',
			tileBackground: '#2d3748',
			tileBackgroundOff: 'rgba(45, 55, 72, 0.6)',
			tileShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
			success: '#68d391',
			warning: '#f6ad55',
			error: '#fc8181',
			info: '#63b3ed',
		},
	},
};

export class ThemeManager {
	private currentTheme: ThemeName = 'light';
	private listeners: Array<( theme: ThemeName ) => void> = [];

	constructor() {
		this.initializeTheme();
	}

	/**
	 * Initialize theme from localStorage or default
	 */
	private initializeTheme(): void {
		// Check URL parameter first
		const urlTheme = this.getThemeFromURL();
		if ( urlTheme ) {
			this.setTheme( urlTheme );
			return;
		}

		// Check localStorage
		const savedTheme = localStorage.getItem( 'tiledash-theme' ) as ThemeName;
		if ( savedTheme && themes[savedTheme] ) {
			this.setTheme( savedTheme );
			return;
		}

		// Use system preference as fallback
		const prefersDark = window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
		this.setTheme( prefersDark ? 'dark' : 'light' );

		// Listen for system theme changes
		window.matchMedia( '(prefers-color-scheme: dark)' ).addEventListener( 'change', ( e ) => {
			if ( !localStorage.getItem( 'tiledash-theme' ) ) {
				this.setTheme( e.matches ? 'dark' : 'light' );
			}
		} );
	}

	/**
	 * Get theme from URL parameter
	 */
	private getThemeFromURL(): ThemeName | null {
		const urlParams = new URLSearchParams( window.location.search );
		const themeParam = urlParams.get( 'theme' ) as ThemeName;
		return themeParam && themes[themeParam] ? themeParam : null;
	}

	/**
	 * Set the active theme
	 */
	public setTheme( themeName: ThemeName ): void {
		if ( !themes[themeName] ) {
			console.warn( `Theme "${themeName}" not found. Using light theme as fallback.` );
			themeName = 'light';
		}

		const theme = themes[themeName];
		this.currentTheme = themeName;

		// Update HTML data attribute
		document.documentElement.setAttribute( 'data-theme', themeName );
		document.body.className = `theme-${themeName}`;

		// Update CSS custom properties
		this.updateCSSCustomProperties( theme );

		// Save to localStorage
		localStorage.setItem( 'tiledash-theme', themeName );

		// Notify listeners
		this.listeners.forEach( listener => listener( themeName ) );

		// Log theme change
		console.log( `Theme changed to: ${theme.displayName}` );
	}

	/**
	 * Update CSS custom properties with theme colors
	 */
	private updateCSSCustomProperties( theme: ThemeConfig ): void {
		const root = document.documentElement;
		const { colors } = theme;

		// Update all theme colors as CSS custom properties
		Object.entries( colors ).forEach( ( [ key, value, ] ) => {
			root.style.setProperty( `--color-${this.kebabCase( key )}`, value );
		} );

		// Legacy support for existing CSS variables
		root.style.setProperty( '--tileOnBackground', colors.tileBackground );
		root.style.setProperty( '--tileOffBackground', colors.tileBackgroundOff );
		root.style.setProperty( '--iconColor', colors.accent );
		root.style.setProperty( '--textColor', colors.text );
		root.style.setProperty( '--sliderPrimColor', colors.primary );
		root.style.setProperty( '--sliderSecColor', colors.border );
		root.style.setProperty( '--gaugePrimColor', colors.primary );
		root.style.setProperty( '--gaugeSecColor', colors.border );
	}

	/**
	 * Convert camelCase to kebab-case
	 */
	private kebabCase( str: string ): string {
		return str.replace( /([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2' ).toLowerCase();
	}

	/**
	 * Get current theme
	 */
	public getCurrentTheme(): ThemeName {
		return this.currentTheme;
	}

	/**
	 * Get current theme config
	 */
	public getCurrentThemeConfig(): ThemeConfig {
		return themes[this.currentTheme];
	}

	/**
	 * Get all available themes
	 */
	public getAvailableThemes(): ThemeConfig[] {
		return Object.values( themes );
	}

	/**
	 * Toggle between light and dark theme
	 */
	public toggleTheme(): void {
		const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
		this.setTheme( newTheme );
	}

	/**
	 * Cycle through all available themes
	 */
	public cycleTheme(): void {
		const themeNames = Object.keys( themes ) as ThemeName[];
		const currentIndex = themeNames.indexOf( this.currentTheme );
		const nextIndex = ( currentIndex + 1 ) % themeNames.length;
		this.setTheme( themeNames[nextIndex] );
	}

	/**
	 * Add theme change listener
	 */
	public onThemeChange( callback: ( theme: ThemeName ) => void ): void {
		this.listeners.push( callback );
	}

	/**
	 * Remove theme change listener
	 */
	public removeThemeChangeListener( callback: ( theme: ThemeName ) => void ): void {
		const index = this.listeners.indexOf( callback );
		if ( index > -1 ) {
			this.listeners.splice( index, 1 );
		}
	}

	/**
	 * Apply theme with smooth transition
	 */
	public setThemeWithTransition( themeName: ThemeName, duration: number = 300 ): void {
		// Add transition class
		document.documentElement.style.setProperty( '--theme-transition-duration', `${duration}ms` );
		document.documentElement.classList.add( 'theme-transitioning' );

		// Set the theme
		this.setTheme( themeName );

		// Remove transition class after animation
		setTimeout( () => {
			document.documentElement.classList.remove( 'theme-transitioning' );
		}, duration );
	}

	/**
	 * Create a theme toggle button element
	 */
	public createThemeToggleButton(): HTMLButtonElement {
		const button = document.createElement( 'button' );
		button.className = 'theme-toggle-button';
		button.innerHTML = this.getThemeIcon( this.currentTheme );
		button.title = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;

		button.addEventListener( 'click', () => {
			this.toggleTheme();
			button.innerHTML = this.getThemeIcon( this.currentTheme );
			button.title = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;
		} );

		return button;
	}

	/**
	 * Get theme icon
	 */
	private getThemeIcon( theme: ThemeName ): string {
		const icons = {
			light: '☀️',
			dark: '🌙',
			tiledash: '🏠',
			'smooth-light': '✨',
			'smooth-dark': '🌌',
		};
		return icons[theme] || '🎨';
	}

	/**
	 * Export current theme for backup/sharing
	 */
	public exportCurrentTheme(): string {
		return JSON.stringify( {
			name: this.currentTheme,
			config: this.getCurrentThemeConfig(),
			timestamp: new Date().toISOString(),
		}, null, 2 );
	}
}

// Global theme manager instance
export const themeManager = new ThemeManager();
