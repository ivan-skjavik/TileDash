import { DashboardConfig } from './types';
import { DashboardUtils, LocalStorageManager, URLManager, DeviceStateManager } from './utils';
import { developmentConfig } from './config/development';

declare global {
  interface Window {
    dashboard: DashboardConfig;
  }
}

class TileDashApp {
  private config: DashboardConfig | null = null;

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      // Load configuration
      await this.loadConfiguration();
      
      // Initialize theme
      this.initializeTheme();
      
      // Initialize dashboard
      await this.initializeDashboard();
      
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

    // Initialize existing TileDash app with the config
    window.dashboard = this.config;

    // Initialize device state management
    this.initializeDeviceStateManagement();

    console.log( 'Dashboard configuration loaded:', this.config );
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
      this.config.settings.token = token;
    }
  }

  private initializeDeviceStateManagement(): void {
    // This would integrate with the existing Athom API handling
    // For now, we'll set up the foundation for state management
    
    // Listen for device state changes from the existing TileDash code
    if ( typeof window.addEventListener === 'function' ) {
      window.addEventListener( 'deviceStateChange', ( ( event: CustomEvent ) => {
        const { deviceId, capabilityId, value, oldValue } = event.detail;
        DeviceStateManager.setState( deviceId, capabilityId, value );
        
        // Log device changes to database if available
        this.logDeviceChange( deviceId, capabilityId, value, oldValue );
      } ) as EventListener );
    }
  }

  private async logDeviceChange( deviceId: string, capabilityId: string, newValue: any, oldValue: any ): Promise<void> {
    try {
      await fetch( '/api/devices/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          device_id: deviceId,
          capability_id: capabilityId,
          new_value: String( newValue ),
          old_value: oldValue ? String( oldValue ) : null
        } )
      } );
    } catch ( error ) {
      console.warn( 'Failed to log device change:', error );
    }
  }

  // Public API for configuration management
  public async saveConfiguration( config: DashboardConfig ): Promise<boolean> {
    try {
      // Validate configuration
      const errors = DashboardUtils.validateDashboardConfig( config );
      if ( errors.length > 0 ) {
        console.error( 'Configuration validation failed:', errors );
        return false;
      }

      // Save to server
      const response = await fetch( '/api/dashboard/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( config )
      } );

      if ( response.ok ) {
        // Save to local storage
        LocalStorageManager.set( 'config', config );
        this.config = config;
        
        // Reload dashboard
        await this.initializeDashboard();
        
        return true;
      }
    } catch ( error ) {
      console.error( 'Failed to save configuration:', error );
    }
    
    return false;
  }

  public getConfiguration(): DashboardConfig | null {
    return this.config;
  }

  public setTheme( theme: string ): void {
    this.applyTheme( theme );
  }
}

// Initialize the application
const app = new TileDashApp();

// Export for global access
( window as any ).TileDashApp = app;
