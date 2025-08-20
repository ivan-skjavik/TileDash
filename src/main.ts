import { AppConfig, DashboardConfig } from './types';
import { DashboardUtils, URLManager, DeviceStateManager } from './utils';
import { appConfig } from '../config';
import { TileRenderer } from './renderers/TileRenderer';
import HomeyClient from './services/HomeyClient';
import { ThemeManager } from './services/ThemeManager';

// Import SCSS styles
import './styles/main.scss';

declare global {
  interface Window {
    TileDashApp: TileDashApp;
  }
}

class TileDashApp {
	public config: AppConfig | null = null;
	public tileRenderer: TileRenderer | null = null;
	public homeyClient: HomeyClient | null = null;
	public themeManager: ThemeManager;

	constructor() {
		// Initialize theme manager first
		this.themeManager = new ThemeManager();
		this.initializeApp();
	}

	private async initializeApp(): Promise<void> {
		console.log( 'TileDashApp: Initializing app...' );
    
		try {
			// Try to connect to Homey
			const connected = await this.connectToHomey();
			if ( !connected ) {
				console.error( 'Failed to connect to Homey, aborting initialization' );
				return;
			}

			// Load configuration
			await this.loadConfiguration();
			console.log( 'TileDashApp: Configuration loaded', this.config );
      
			// Initialize theme
			this.initializeTheme();
			console.log( 'TileDashApp: Theme initialized' );
      
			// Initialize dashboard (which includes connecting to Homey first)
			await this.initializeDashboard();
			console.log( 'TileDashApp: Dashboard initialized' );
      
			console.log( 'TileDash initialized successfully' );

			// Set orientation and add eventlistener to catch orientation changes
			document.body.classList.toggle( 'portrait', window.innerHeight > window.innerWidth );
			window.addEventListener( 'resize', () => {
				console.log( 'onResize' );
				document.body.classList.toggle( 'portrait', window.innerHeight > window.innerWidth );
			} );
		} catch ( error ) {
			console.error( 'Failed to initialize TileDash:', error );
		}
	}

	private getSelectedDashboard(): DashboardConfig | null {
		if ( !this.config || !this.config.dashboards || this.config.dashboards.length === 0 ) {
			return null;
		}

		// Get dashboard ID from URL parameter
		const dashboardId = URLManager.getDashboardId();
		
		if ( dashboardId ) {
			// Find dashboard by ID
			const dashboard = this.config.dashboards.find( d => d.id === dashboardId );
			if ( dashboard ) {
				return dashboard;
			}
			console.warn( `Dashboard with ID '${dashboardId}' not found, using first available dashboard` );
		}
		
		// Return first dashboard if no ID specified or ID not found
		return this.config.dashboards[0];
	}

	private async loadConfiguration(): Promise<void> {
		// Load configuration from config.ts file
		this.config = appConfig;

		// Set tileMargin, groupMargin and iconSize as css vars
		document.documentElement.style.setProperty( '--tile-margin', `${this.config.settings.tileMargin}px` );
		document.documentElement.style.setProperty( '--tile-size', `${this.config.settings.tileSize}px` );
		document.documentElement.style.setProperty( '--icon-size', `${this.config.settings.iconSize}px` );

		console.log( 'TileDashApp: Configuration loaded from config.ts' );
	}

	private initializeTheme(): void {
		// Theme initialization is now handled by ThemeManager constructor
		// We can add theme change listeners here if needed
		this.themeManager.onThemeChange( ( theme: string ) => {
			console.log( `Theme changed to: ${theme}` );
		} );
	}

	private initializeTileRenderer(): void {
		try {
			if ( !this.homeyClient ) {
				throw new Error( 'HomeyClient not available' )
			}

			if ( !this.config ) {
				throw new Error( 'AppConfig not available' );
			}

			// Initialization with HomeyClient
			this.tileRenderer = new TileRenderer( 'dashboardContainer', this.homeyClient, this.config );
		} catch ( error ) {
			console.error( 'Failed to initialize tile renderer:', error );
		}
	}

	private async initializeDashboard(): Promise<void> {
		if ( !this.config ) {
			console.error( 'No configuration available' );
			return;
		}

		// Validate configuration
		const errors = DashboardUtils.validateDashboardConfig( this.config );
		if ( errors.length > 0 ) {
			console.error( 'Configuration validation errors:', errors );
		}

		// Apply URL overrides (theme, orientation, etc.)
		this.applyURLOverrides();

		// Initialize header display
		this.initializeHeader();

		// Initialize tile renderer AFTER HomeyClient is set up
		this.initializeTileRenderer();
		console.log( 'TileDashApp: Tile renderer initialized', this.tileRenderer );

		// Render dashboard with tiles
		if ( this.tileRenderer ) {
			const devices = await this.homeyClient?.getDevices();

			if ( !devices ) {
				console.error( '⛔ Failed to retrieve devices from Homey, aborting' );
				return;
			}

			const selectedDashboard = this.getSelectedDashboard();
			if ( !selectedDashboard ) {
				console.error( '⛔ No dashboard available to render' );
				return;
			}

			console.log( `TileDashApp: Rendering dashboard '${selectedDashboard.title || selectedDashboard.id}'` );
			this.tileRenderer.renderDashboard( selectedDashboard.pages, this.config.settings, devices );
		}		// Initialize device state management
		this.initializeDeviceStateManagement();

		console.log( 'Dashboard configuration loaded:', this.config );
	}

	private async connectToHomey() {
		try {
			this.homeyClient = new HomeyClient();
      
			// Use the new OAuth-based authentication
			await this.homeyClient.initializeAuth();

			return true
		} catch ( error ) {
			console.error( '❌ Homey connection failed:', error );
			return false
		}
	}

	private initializeHeader(): void {
		if ( !this.config ) return;

		// Initialize header elements
		const headerSecondary = document.getElementById( 'headerSecondary' );
		const customText = document.getElementById( 'customText' );
		const currentTime = document.getElementById( 'currentTime' );
		const currentDate = document.getElementById( 'currentDate' );

		if ( headerSecondary && customText && currentTime && currentDate ) {
			// Show header elements
			headerSecondary.style.display = 'flex';
			customText.style.display = 'flex';

			// Set custom text
			customText.textContent = this.config.settings.customText || 'TileDash';

			// Add theme toggle button
			const themeToggle = this.themeManager.createToggleButton();
			themeToggle.style.marginLeft = '10px';
			headerSecondary.appendChild( themeToggle );

			// Update time and date
			this.updateTimeAndDate();
      
			// Update time every minute
			setInterval( () => {
				this.updateTimeAndDate();
			}, 60000 );
		}
	}

	private updateTimeAndDate(): void {
		const currentTime = document.getElementById( 'currentTime' );
		const currentDate = document.getElementById( 'currentDate' );
    
		if ( currentTime && currentDate && this.config ) {
			const now = new Date();
      
			// Update time
			const timeString = now.getHours().toString().padStart( 2, '0' ) + ':' + 
                        now.getMinutes().toString().padStart( 2, '0' );
			currentTime.textContent = timeString;

			// Update date
			const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', };
			const dateString = new Intl.DateTimeFormat( this.config.settings.dateLocal || 'en-EN', options ).format( now );
			currentDate.textContent = dateString;
		}
	}

	private applyURLOverrides(): void {
		if ( !this.config ) return;

		const orientation = URLManager.getOrientation();
		if ( orientation ) {
			this.config.settings.orientation = orientation;
		}

		// Theme URL override is now handled by ThemeManager constructor
		// through URL parameters, so no need to handle it here
	}

	private initializeDeviceStateManagement(): void {
		if ( !this.homeyClient ) {
			throw new Error( 'HomeyClient is not initialized' );
		}
		console.log( 'initializeDeviceStateManagement' );
    
		// Set up device state change listeners
		if ( typeof window.addEventListener === 'function' ) {
			window.addEventListener( 'deviceStateChange', ( ( event: CustomEvent ) => {
				console.log( 'Device state changed:', event.detail );
        
				const { deviceId, capabilityId, value, oldValue, } = event.detail;
				DeviceStateManager.setState( deviceId, capabilityId, value );
        
				// Log device changes to database if available
				this.logDeviceChange( deviceId, capabilityId, value, oldValue );
			} ) as EventListener );
		}

		// Set up Homey device event listeners if connected
		if ( this.homeyClient.isConnected ) {
			this.homeyClient.onDeviceUpdate( ( device ) => {
				console.log( 'Device updated:', device.name );
				// Update the tile renderer with new device data
				if ( this.tileRenderer ) {
					this.tileRenderer.updateDevices( [ device, ] );
				}
			} );
		}
	}

	private async logDeviceChange( deviceId: string, capabilityId: string, value: any, oldValue: any ): Promise<void> {
		try {
			const response = await fetch( '/api/device-changes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify( {
					deviceId,
					capabilityId,
					value,
					oldValue,
					timestamp: Date.now(),
				} ),
			} );
      
			if ( !response.ok ) {
				console.warn( 'Failed to log device change to database' );
			}
		} catch ( error ) {
			console.warn( 'Error logging device change:', error );
		}
	}
}

// Initialize the app
const app = new TileDashApp();

// Make it globally available
window.TileDashApp = app;

// Export for module usage
export default TileDashApp;
