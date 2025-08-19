import { DashboardConfig } from './types';
import { DashboardUtils, LocalStorageManager, URLManager, DeviceStateManager } from './utils';
import { developmentConfig } from './config/development';
import { TileRenderer } from './renderers/TileRenderer';
import HomeyClient from './services/HomeyClient';

// Debug log to confirm script is loading
console.log( 'TileDash main.ts loaded successfully!' );

declare global {
  interface Window {
    dashboard: DashboardConfig;
    TileDashApp: TileDashApp;
  }
}

class TileDashApp {
  private config: DashboardConfig | null = null;
  private tileRenderer: TileRenderer | null = null;
  private homeyClient: HomeyClient | null = null;

  constructor() {
    console.log( 'TileDashApp: Constructor called' );
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    console.log( 'TileDashApp: Initializing app...' );
    try {
      // Load configuration
      await this.loadConfiguration();
      console.log( 'TileDashApp: Configuration loaded', this.config );
      
      // Initialize theme
      this.initializeTheme();
      console.log( 'TileDashApp: Theme initialized' );
      
      // Initialize tile renderer
      this.initializeTileRenderer();
      console.log( 'TileDashApp: Tile renderer initialized', this.tileRenderer );
      
      // Initialize dashboard
      await this.initializeDashboard();
      console.log( 'TileDashApp: Dashboard initialized' );
      
      console.log( 'TileDash initialized successfully' );
    } catch ( error ) {
      console.error( 'Failed to initialize TileDash:', error );
    }
  }

  private async loadConfiguration(): Promise<void> {
    // First try to load from window.dashboard (legacy support)
    if ( window.dashboard ) {
      this.config = window.dashboard;
      return;
    }

    // Then try to load from local storage
    const savedConfig = LocalStorageManager.get<DashboardConfig>( 'config' );
    if ( savedConfig ) {
      this.config = savedConfig;
      return;
    }

    // Finally, try to load from server
    try {
      const response = await fetch( '/api/dashboard/config' );
      if ( response.ok ) {
        this.config = await response.json();
        LocalStorageManager.set( 'config', this.config );
      }
    } catch ( error ) {
      console.warn( 'Failed to load config from server:', error );
    }

    // If no config found, use default
    if ( !this.config ) {
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): DashboardConfig {
    // Use the imported development configuration
    return developmentConfig;
  }

  private initializeTheme(): void {
    const theme = URLManager.getTheme() || LocalStorageManager.get<string>( 'theme' ) || 'tiledash';
    this.applyTheme( theme );
  }

  private applyTheme( theme: string ): void {
    const validThemes = ['tiledash', 'smooth-light', 'smooth-dark'];
    const selectedTheme = validThemes.includes( theme ) ? theme : 'tiledash';
    
    // Remove existing theme classes
    document.body.classList.remove( ...validThemes );
    
    // Add selected theme class
    document.body.classList.add( selectedTheme );
    
    // Load corresponding CSS file if not default
    if ( selectedTheme !== 'tiledash' ) {
      this.loadThemeCSS( selectedTheme );
    }
    
    // Save theme preference
    LocalStorageManager.set( 'theme', selectedTheme );
  }

  private loadThemeCSS( theme: string ): void {
    const existingLink = document.querySelector( `link[data-theme="${theme}"]` );
    if ( !existingLink ) {
      const link = document.createElement( 'link' );
      link.rel = 'stylesheet';
      link.href = `./css/${theme}.css`;
      link.setAttribute( 'data-theme', theme );
      document.head.appendChild( link );
    }
  }

  private initializeTileRenderer(): void {
    try {
      this.tileRenderer = new TileRenderer( 'dashboardContainer' );
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

    // Apply URL overrides (including token checking)
    await this.applyURLOverrides();

    // Initialize header display
    this.initializeHeader();

    // Try to connect to Homey using OAuth flow or existing token
    let devices: any[] = [];
    try {
      devices = await this.connectToHomey();
    } catch ( error ) {
      console.warn( 'Failed to connect to Homey:', error );
    }

    // Render dashboard with tiles
    if ( this.tileRenderer ) {
      this.tileRenderer.renderDashboard( this.config.dashboard, this.config.settings, devices );
    }

    // Initialize device state management
    this.initializeDeviceStateManagement();

    console.log( 'Dashboard configuration loaded:', this.config );
  }

  private async connectToHomey(): Promise<any[]> {
    try {
      this.homeyClient = new HomeyClient();
      
      // Use the new OAuth-based authentication
      const connected = await this.homeyClient.initializeAuth();
      
      if ( connected ) {
        const devices = await this.homeyClient.getDevices();
        console.log( `✅ Connected to Homey with ${devices.length} devices` );
        return devices;
      } else {
        console.log( '🔄 OAuth flow initiated, page will redirect...' );
        return [];
      }
    } catch ( error ) {
      console.error( '❌ Homey connection failed:', error );
      
      // For development, fall back to development config devices
      if ( this.config?.settings.token === 'development_token' ) {
        console.log( '🛠️ Using development mode - no real Homey connection' );
        return [];
      }
      
      throw error;
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
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
      const dateString = new Intl.DateTimeFormat( this.config.settings.dateLocal || 'en-EN', options ).format( now );
      currentDate.textContent = dateString;
    }
  }

  private async applyURLOverrides(): Promise<void> {
    if ( !this.config ) return;

    const orientation = URLManager.getOrientation();
    if ( orientation ) {
      this.config.settings.orientation = orientation;
    }

    // Check for token in environment first, then URL params
    const token = await URLManager.getTokenWithPriority();
    if ( token ) {
        console.log('got token', token);
        
      this.config.settings.token = token;
    }
  }

  private initializeDeviceStateManagement(): void {
    // Set up device state change listeners
    if ( typeof window.addEventListener === 'function' ) {
      window.addEventListener( 'deviceStateChange', ( ( event: CustomEvent ) => {
        const { deviceId, capabilityId, value, oldValue } = event.detail;
        DeviceStateManager.setState( deviceId, capabilityId, value );
        
        // Log device changes to database if available
        this.logDeviceChange( deviceId, capabilityId, value, oldValue );
      } ) as EventListener );
    }

    // Set up Homey device event listeners if connected
    if ( this.homeyClient?.isApiConnected() ) {
      this.homeyClient.onDeviceUpdate( ( device ) => {
        console.log( 'Device updated:', device.name );
        // Update the tile renderer with new device data
        if ( this.tileRenderer ) {
          this.tileRenderer.updateDevices( [device] );
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
          timestamp: Date.now()
        } )
      } );
      
      if ( !response.ok ) {
        console.warn( 'Failed to log device change to database' );
      }
    } catch ( error ) {
      console.warn( 'Error logging device change:', error );
    }
  }

  // Public methods for external access
  public getConfig(): DashboardConfig | null {
    return this.config;
  }

  public getTileRenderer(): TileRenderer | null {
    return this.tileRenderer;
  }

  public getHomeyClient(): HomeyClient | null {
    return this.homeyClient;
  }

  public async updateConfiguration( newConfig: DashboardConfig ): Promise<void> {
    this.config = newConfig;
    LocalStorageManager.set( 'config', this.config );
    
    // Re-render dashboard
    if ( this.tileRenderer && this.config ) {
      const devices = this.homeyClient?.isApiConnected() ? 
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
