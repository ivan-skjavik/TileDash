import { DashboardConfig } from './types';
import { DashboardUtils, LocalStorageManager, URLManager, DeviceStateManager } from './utils';
import { developmentConfig } from './config/development';
import { TileRenderer } from './renderers/TileRenderer';
import HomeyClient from './services/HomeyClient';

declare global {
  interface Window {
    TileDashApp: TileDashApp;
  }
}

class TileDashApp {
	public config: DashboardConfig | null = null;
	public tileRenderer: TileRenderer | null = null;
	public homeyClient: HomeyClient | null = null;

	constructor() {
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
		} catch ( error ) {
			console.error( 'Failed to initialize TileDash:', error );
		}
	}

	private async loadConfiguration(): Promise<void> {
		// TODO implement screens for editing configs in db.
		// Try to load from server/db
		try {
			const response = await fetch( '/api/dashboard/config' );
			if ( response.ok ) {
				this.config = await response.json();
			}
		} catch ( error ) {
			console.warn( 'Failed to load config from server:', error );
		}

		// If no config found, use default
		if ( !this.config ) {
			this.config = developmentConfig;
		}
	}

	private initializeTheme(): void {
		const theme = URLManager.getTheme() || LocalStorageManager.get<string>( 'theme' ) || 'tiledash';
		this.applyTheme( theme );
	}

	private applyTheme( theme: string ): void {
		const validThemes = [ 'tiledash', 'smooth-light', 'smooth-dark', ];
		const selectedTheme = validThemes.includes( theme ) ? theme : 'tiledash';
    
		// Remove existing theme classes
		document.body.classList.remove( ...validThemes );
    
		// Add selected theme class
		document.body.classList.add( selectedTheme );
    
		// Load corresponding CSS file if not default
		if ( selectedTheme !== 'tiledash' ) {
			const existingLink = document.querySelector( `link[data-theme="${selectedTheme}"]` );

			if ( !existingLink ) {
				const link = document.createElement( 'link' );
				link.rel = 'stylesheet';
				link.href = `./css/${selectedTheme}.css`;
				link.setAttribute( 'data-theme', selectedTheme );
				document.head.appendChild( link );
			}
		}
    
		// Save theme preference
		LocalStorageManager.set( 'theme', selectedTheme );
	}

	private initializeTileRenderer(): void {
		try {
			if ( !this.homeyClient ) {
				throw new Error( 'HomeyClient not available' )
			}

			// Initialization with HomeyClient
			this.tileRenderer = new TileRenderer( 'dashboardContainer', this.homeyClient );
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

			this.tileRenderer.renderDashboard( this.config.dashboard, this.config.settings, devices );
		}

		// Initialize device state management
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
		const headerLeft = document.getElementById( 'headerLeft' );
		const customText = document.getElementById( 'customText' );
		const currentTime = document.getElementById( 'currentTime' );
		const currentDate = document.getElementById( 'currentDate' );

		if ( headerLeft && customText && currentTime && currentDate ) {
			// Show header elements
			headerLeft.style.display = 'flex';
			customText.style.display = 'flex';

			// Set custom text
			customText.textContent = this.config.settings.customText || 'TileDash';

			//   TODO more stuff here probably (header sensor?)
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

		const theme = URLManager.getTheme();
		if ( theme ) {
			this.applyTheme( theme );
		}
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

	public async updateConfiguration( newConfig: DashboardConfig ): Promise<void> {
		if ( !this.homeyClient ) {
			throw new Error( 'HomeyClient is not initialized' );
		}

		this.config = newConfig;
		LocalStorageManager.set( 'config', this.config );
    
		// Re-render dashboard
		if ( this.tileRenderer && this.config ) {
			const devices = this.homeyClient.isConnected ? 
				await this.homeyClient.getDevices() : [];
			this.tileRenderer.renderDashboard( this.config.dashboard, this.config.settings, devices );
		}
	}
}

// Initialize the app
const app = new TileDashApp();

// Make it globally available
window.TileDashApp = app;

// Export for module usage
export default TileDashApp;
