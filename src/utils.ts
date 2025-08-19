import { DashboardConfig, Tile, TileSettings } from './types.js';

// Dashboard utilities and helpers
export class DashboardUtils {
  static validateTilePosition( tile: Tile, groupWidth: number, groupHeight: number ): boolean {
    const [x, y] = tile.position;
    return x >= 0 && y >= 0 && 
           x + tile.width <= groupWidth && 
           y + tile.height <= groupHeight;
  }

  static checkTileOverlap( tile1: Tile, tile2: Tile ): boolean {
    const [x1, y1] = tile1.position;
    const [x2, y2] = tile2.position;
    
    return !(x1 + tile1.width <= x2 || 
             x2 + tile2.width <= x1 || 
             y1 + tile1.height <= y2 || 
             y2 + tile2.height <= y1);
  }

  static validateDashboardConfig( config: DashboardConfig ): string[] {
    const errors: string[] = [];
    
    // Validate settings
    if ( !config.settings ) {
      errors.push( 'Settings are required' );
      return errors;
    }
    
    if ( !config.dashboard || !Array.isArray( config.dashboard ) ) {
      errors.push( 'Dashboard pages are required and must be an array' );
      return errors;
    }
    
    // Validate each page
    config.dashboard.forEach( ( page, pageIndex ) => {
      if ( !page.icon ) {
        errors.push( `Page ${pageIndex + 1}: Icon is required` );
      }
      
      if ( !page.group || !Array.isArray( page.group ) ) {
        errors.push( `Page ${pageIndex + 1}: Groups are required and must be an array` );
        return;
      }
      
      // Validate each group
      page.group.forEach( ( group, groupIndex ) => {
        if ( group.width <= 0 || group.height <= 0 ) {
          errors.push( `Page ${pageIndex + 1}, Group ${groupIndex + 1}: Width and height must be positive` );
        }
        
        if ( !group.items || !Array.isArray( group.items ) ) {
          errors.push( `Page ${pageIndex + 1}, Group ${groupIndex + 1}: Items are required and must be an array` );
          return;
        }
        
        // Validate tiles in group
        const usedIds = new Set<string>();
        group.items.forEach( ( tile, tileIndex ) => {
          // Check position validity
          if ( !this.validateTilePosition( tile, group.width, group.height ) ) {
            errors.push( `Page ${pageIndex + 1}, Group ${groupIndex + 1}, Tile ${tileIndex + 1}: Position is invalid` );
          }
          
          // Check for overlaps with other tiles
          group.items.slice( tileIndex + 1 ).forEach( ( otherTile, otherIndex ) => {
            if ( this.checkTileOverlap( tile, otherTile ) ) {
              errors.push( `Page ${pageIndex + 1}, Group ${groupIndex + 1}: Tile ${tileIndex + 1} overlaps with tile ${tileIndex + otherIndex + 2}` );
            }
          } );
          
          // Check for duplicate IDs (for tiles that have IDs)
          if ( 'id' in tile && tile.id ) {
            const tileKey = `${tile.id}-${'capabilityID' in tile ? tile.capabilityID : ''}`;
            if ( usedIds.has( tileKey ) ) {
              errors.push( `Page ${pageIndex + 1}, Group ${groupIndex + 1}: Duplicate device ID and capability combination: ${tileKey}` );
            }
            usedIds.add( tileKey );
          }
        } );
      } );
    } );
    
    return errors;
  }

  static generateTileId(): string {
    return `tile-${Date.now()}-${Math.random().toString( 36 ).substr( 2, 9 )}`;
  }

  static calculateOptimalTileSize( containerWidth: number, containerHeight: number, settings: TileSettings ): number {
    const baseSize = settings.tileSize || 80;
    const margin = settings.tileMargin || 5;
    
    // Calculate based on container dimensions
    const widthBasedSize = Math.floor( ( containerWidth - margin * 2 ) / 10 );
    const heightBasedSize = Math.floor( ( containerHeight - margin * 2 ) / 8 );
    
    return Math.min( baseSize, widthBasedSize, heightBasedSize );
  }
}

export class LocalStorageManager {
  private static readonly STORAGE_PREFIX = 'tiledash_';

  static set( key: string, value: any ): void {
    try {
      localStorage.setItem( this.STORAGE_PREFIX + key, JSON.stringify( value ) );
    } catch ( error ) {
      console.warn( 'Failed to save to localStorage:', error );
    }
  }

  static get<T>( key: string, defaultValue?: T ): T | undefined {
    try {
      const item = localStorage.getItem( this.STORAGE_PREFIX + key );
      return item ? JSON.parse( item ) : defaultValue;
    } catch ( error ) {
      console.warn( 'Failed to read from localStorage:', error );
      return defaultValue;
    }
  }

  static remove( key: string ): void {
    try {
      localStorage.removeItem( this.STORAGE_PREFIX + key );
    } catch ( error ) {
      console.warn( 'Failed to remove from localStorage:', error );
    }
  }

  static clear(): void {
    try {
      Object.keys( localStorage )
        .filter( key => key.startsWith( this.STORAGE_PREFIX ) )
        .forEach( key => localStorage.removeItem( key ) );
    } catch ( error ) {
      console.warn( 'Failed to clear localStorage:', error );
    }
  }
}

export class URLManager {
  static getToken(): string | null {
    const urlParams = new URLSearchParams( window.location.search );
    return urlParams.get( 'token' );
  }

  static async getEnvironmentToken(): Promise<string | null> {
    try {
      const response = await fetch( '/api/env/token' );
      if ( response.ok ) {
        const data = await response.json();
        return data.token;
      }
    } catch ( error ) {
      console.warn( 'Failed to get environment token:', error );
    }
    return null;
  }

  static async getTokenWithPriority(): Promise<string | null> {
    // First check environment variables
    const envToken = await this.getEnvironmentToken();
    if ( envToken ) {
      console.log( '🔑 Using token from environment variables' );
      return envToken;
    }
    
    // Then check URL parameters
    const urlToken = this.getToken();
    if ( urlToken ) {
      console.log( '🔑 Using token from URL parameters' );
      return urlToken;
    }
    
    console.log( '⚠️ No token found in environment or URL' );
    return null;
  }

  static getTheme(): string | null {
    const urlParams = new URLSearchParams( window.location.search );
    return urlParams.get( 'theme' );
  }

  static getOrientation(): 'landscape' | 'portrait' | null {
    const urlParams = new URLSearchParams( window.location.search );
    const orientation = urlParams.get( 'orientation' );
    return orientation === 'portrait' || orientation === 'landscape' ? orientation : null;
  }

  // OAuth-related methods
  static getAuthorizationCode(): string | null {
    const urlParams = new URLSearchParams( window.location.search );
    console.log('auth code in url:', urlParams.get('auth_code'));
    return urlParams.get( 'auth_code' );
  }

  static getAuthError(): string | null {
    const urlParams = new URLSearchParams( window.location.search );
    return urlParams.get( 'auth_error' );
  }

  static getOAuthState(): string | null {
    const urlParams = new URLSearchParams( window.location.search );
    return urlParams.get( 'state' );
  }

  static clearOAuthParams(): void {
    const url = new URL( window.location.href );
    url.searchParams.delete( 'auth_code' );
    url.searchParams.delete( 'auth_error' );
    url.searchParams.delete( 'state' );
    window.history.replaceState( {}, '', url.toString() );
  }

  static updateURL( params: Record<string, string> ): void {
    const url = new URL( window.location.href );
    Object.entries( params ).forEach( ( [key, value] ) => {
      if ( value ) {
        url.searchParams.set( key, value );
      } else {
        url.searchParams.delete( key );
      }
    } );
    window.history.replaceState( {}, '', url.toString() );
  }
}

export class DeviceStateManager {
  private static deviceStates = new Map<string, any>();
  private static listeners = new Map<string, Set<Function>>();

  static setState( deviceId: string, capabilityId: string, value: any ): void {
    const key = `${deviceId}-${capabilityId}`;
    const oldValue = this.deviceStates.get( key );
    
    if ( oldValue !== value ) {
      this.deviceStates.set( key, value );
      this.notifyListeners( key, value, oldValue );
    }
  }

  static getState( deviceId: string, capabilityId: string ): any {
    const key = `${deviceId}-${capabilityId}`;
    return this.deviceStates.get( key );
  }

  static addListener( deviceId: string, capabilityId: string, callback: Function ): void {
    const key = `${deviceId}-${capabilityId}`;
    if ( !this.listeners.has( key ) ) {
      this.listeners.set( key, new Set() );
    }
    this.listeners.get( key )!.add( callback );
  }

  static removeListener( deviceId: string, capabilityId: string, callback: Function ): void {
    const key = `${deviceId}-${capabilityId}`;
    const listenerSet = this.listeners.get( key );
    if ( listenerSet ) {
      listenerSet.delete( callback );
      if ( listenerSet.size === 0 ) {
        this.listeners.delete( key );
      }
    }
  }

  private static notifyListeners( key: string, newValue: any, oldValue: any ): void {
    const listenerSet = this.listeners.get( key );
    if ( listenerSet ) {
      listenerSet.forEach( callback => {
        try {
          callback( newValue, oldValue );
        } catch ( error ) {
          console.error( 'Error in device state listener:', error );
        }
      } );
    }
  }
}
