/**
 * Minimal Theme Manager for TileDash
 * 
 * Simple theme switching between light and dark modes
 * Uses CSS custom properties defined in theme files
 */

export type ThemeName = 'light' | 'dark';

export class ThemeManager {
	private currentTheme: ThemeName = 'light';
	private listeners: Array<( theme: ThemeName ) => void> = [];

	constructor() {
		this.initializeTheme();
		this.setupSystemThemeListener();
	}

	/**
	 * Initialize theme from localStorage, URL, or system preference
	 */
	private initializeTheme(): void {
		// 1. Check URL parameter first
		const urlTheme = this.getThemeFromURL();
		if ( urlTheme ) {
			this.setTheme( urlTheme );
			return;
		}

		// 2. Check localStorage
		const savedTheme = localStorage.getItem( 'tiledash-theme' ) as ThemeName;
		if ( savedTheme && ( savedTheme === 'light' || savedTheme === 'dark' ) ) {
			this.setTheme( savedTheme );
			return;
		}

		// 3. Use system preference
		const prefersDark = window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
		this.setTheme( prefersDark ? 'dark' : 'light' );
	}

	/**
	 * Listen for system theme changes
	 */
	private setupSystemThemeListener(): void {
		if ( window.matchMedia ) {
			const mediaQuery = window.matchMedia( '(prefers-color-scheme: dark)' );
			mediaQuery.addEventListener( 'change', ( e ) => {
				// Only auto-switch if no explicit theme is set
				const hasExplicitTheme = localStorage.getItem( 'tiledash-theme' ) || 
					new URLSearchParams( window.location.search ).get( 'theme' );
				
				if ( !hasExplicitTheme ) {
					this.setTheme( e.matches ? 'dark' : 'light' );
				}
			} );
		}
	}

	/**
	 * Get theme from URL parameter
	 */
	private getThemeFromURL(): ThemeName | null {
		const params = new URLSearchParams( window.location.search );
		const theme = params.get( 'theme' );
		return theme === 'dark' || theme === 'light' ? theme : null;
	}

	/**
	 * Get current theme
	 */
	public getCurrentTheme(): ThemeName {
		return this.currentTheme;
	}

	/**
	 * Set theme
	 */
	public setTheme( theme: ThemeName ): void {
		if ( theme === this.currentTheme ) return;

		this.currentTheme = theme;
		
		// Apply to DOM
		document.body.setAttribute( 'data-theme', theme );
		
		// Save to localStorage
		localStorage.setItem( 'tiledash-theme', theme );
		
		// Notify listeners
		this.listeners.forEach( listener => {
			try {
				listener( theme );
			} catch ( error ) {
				console.error( 'Theme change listener error:', error );
			}
		} );
	}

	/**
	 * Toggle between light and dark
	 */
	public toggleTheme(): void {
		this.setTheme( this.currentTheme === 'light' ? 'dark' : 'light' );
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
	public offThemeChange( callback: ( theme: ThemeName ) => void ): void {
		const index = this.listeners.indexOf( callback );
		if ( index > -1 ) {
			this.listeners.splice( index, 1 );
		}
	}

	/**
	 * Create theme toggle button
	 */
	public createToggleButton(): HTMLButtonElement {
		const button = document.createElement( 'button' );
		button.className = 'theme-toggle';
		button.setAttribute( 'aria-label', 'Toggle theme' );
		
		this.updateButtonIcon( button );
		
		button.addEventListener( 'click', () => {
			this.toggleTheme();
		} );
		
		this.onThemeChange( () => {
			this.updateButtonIcon( button );
		} );
		
		return button;
	}

	/**
	 * Update toggle button icon
	 */
	private updateButtonIcon( button: HTMLButtonElement ): void {
		button.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
		button.title = `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} theme`;
	}
}

// Export singleton instance
export const themeManager = new ThemeManager();
