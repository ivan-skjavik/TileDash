import { HomeyDevice } from '../types';

export class HomeyApiService {
  private homey: any = null;
  private devices: Map<string, HomeyDevice> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // Initialize with the global homey object if available
    if ( ( window as any ).homey ) {
      this.homey = ( window as any ).homey;
    }
  }

  async initialize( token: string ): Promise<boolean> {
    try {
      // Create Homey instance (assuming athom-api is still loaded)
      if ( typeof ( window as any ).AthomCloudAPI !== 'undefined' ) {
        const api = new ( window as any ).AthomCloudAPI( {
          clientId: '5cbb504da1fc782009f52e46',
          clientSecret: 'gvhs0gebgir8vz8yo2l0jfb49u9xzzhrkuo1uvs8',
          redirectUrl: 'https://callback.athom.com/oauth2/callback/'
        } );

        // Parse token if it's a string
        const tokenObj = typeof token === 'string' ? JSON.parse( atob( token ) ) : token;
        api.setToken( tokenObj );
        
        this.homey = await api.getAuthenticatedUser();
        this.homey = await this.homey.getFirstHomey();
        
        console.log( '🏠 Homey API initialized successfully' );
        return true;
      }
      
      throw new Error( 'AthomCloudAPI not available' );
    } catch ( error ) {
      console.error( '❌ Failed to initialize Homey API:', error );
      return false;
    }
  }

  async loadDevices(): Promise<Map<string, HomeyDevice>> {
    if ( !this.homey ) {
      throw new Error( 'Homey API not initialized' );
    }

    try {
      const devices = await this.homey.devices.getDevices();
      this.devices.clear();
      
      Object.values( devices ).forEach( ( device: any ) => {
        const homeyDevice: HomeyDevice = {
          id: device.id,
          name: device.name,
          iconObj: device.iconObj,
          ui: device.ui,
          capabilitiesObj: device.capabilitiesObj || {},
          capabilities: device.capabilities || [],
          class: device.class,
          energy: device.energy,
          settings: device.settings,
          store: device.store,
          flags: device.flags,
          driverUri: device.driverUri,
          zone: device.zone,
          driverId: device.driverId,
          ownerName: device.ownerName
        };
        
        this.devices.set( device.id, homeyDevice );
      } );

      console.log( `📱 Loaded ${this.devices.size} devices from Homey` );
      return this.devices;
    } catch ( error ) {
      console.error( '❌ Failed to load devices:', error );
      throw error;
    }
  }

  getDevice( deviceId: string ): HomeyDevice | undefined {
    return this.devices.get( deviceId );
  }

  getAllDevices(): Map<string, HomeyDevice> {
    return new Map( this.devices );
  }

  async setCapabilityValue( deviceId: string, capabilityId: string, value: any ): Promise<boolean> {
    try {
      if ( !this.homey ) {
        throw new Error( 'Homey API not initialized' );
      }

      const device = this.devices.get( deviceId );
      if ( !device ) {
        throw new Error( `Device ${deviceId} not found` );
      }

      // Update local state immediately for responsive UI
      const oldValue = device.capabilitiesObj[capabilityId]?.value;
      if ( device.capabilitiesObj[capabilityId] ) {
        device.capabilitiesObj[capabilityId].value = value;
      }

      // Emit state change event
      this.emitDeviceStateChange( deviceId, capabilityId, value, oldValue );

      // Send to Homey
      await this.homey.devices.setCapabilityValue( {
        deviceId,
        capabilityId,
        value
      } );

      return true;
    } catch ( error ) {
      console.error( `❌ Failed to set capability value for ${deviceId}.${capabilityId}:`, error );
      return false;
    }
  }

  async triggerFlow( flowId: string ): Promise<boolean> {
    try {
      if ( !this.homey ) {
        throw new Error( 'Homey API not initialized' );
      }

      await this.homey.flow.triggerFlow( { id: flowId } );
      console.log( `🔄 Triggered flow ${flowId}` );
      return true;
    } catch ( error ) {
      console.error( `❌ Failed to trigger flow ${flowId}:`, error );
      return false;
    }
  }

  setupDeviceListeners(): void {
    if ( !this.homey ) return;

    // Listen for device updates
    this.homey.devices.on( 'device.update', ( deviceId: string, device: any ) => {
      console.log( `📱 Device updated: ${deviceId}` );
      
      const existingDevice = this.devices.get( deviceId );
      if ( existingDevice ) {
        // Update capabilities and emit events for changed values
        Object.keys( device.capabilitiesObj || {} ).forEach( capabilityId => {
          const newValue = device.capabilitiesObj[capabilityId]?.value;
          const oldValue = existingDevice.capabilitiesObj[capabilityId]?.value;
          
          if ( newValue !== oldValue ) {
            existingDevice.capabilitiesObj[capabilityId] = device.capabilitiesObj[capabilityId];
            this.emitDeviceStateChange( deviceId, capabilityId, newValue, oldValue );
          }
        } );
      }
    } );

    console.log( '👂 Device listeners set up' );
  }

  private emitDeviceStateChange( deviceId: string, capabilityId: string, value: any, oldValue: any ): void {
    // Emit custom event for the new app system
    const event = new CustomEvent( 'deviceStateChange', {
      detail: { deviceId, capabilityId, value, oldValue }
    } );
    window.dispatchEvent( event );

    // Notify specific listeners
    const key = `${deviceId}.${capabilityId}`;
    const listeners = this.eventListeners.get( key );
    if ( listeners ) {
      listeners.forEach( callback => {
        try {
          callback( value, oldValue );
        } catch ( error ) {
          console.error( 'Error in device state listener:', error );
        }
      } );
    }
  }

  addDeviceListener( deviceId: string, capabilityId: string, callback: Function ): void {
    const key = `${deviceId}.${capabilityId}`;
    if ( !this.eventListeners.has( key ) ) {
      this.eventListeners.set( key, new Set() );
    }
    this.eventListeners.get( key )!.add( callback );
  }

  removeDeviceListener( deviceId: string, capabilityId: string, callback: Function ): void {
    const key = `${deviceId}.${capabilityId}`;
    const listeners = this.eventListeners.get( key );
    if ( listeners ) {
      listeners.delete( callback );
      if ( listeners.size === 0 ) {
        this.eventListeners.delete( key );
      }
    }
  }

  isConnected(): boolean {
    return this.homey !== null;
  }

  getConnectionStatus(): string {
    if ( !this.homey ) return 'disconnected';
    return 'connected';
  }

  // Utility methods for backward compatibility
  static formatCapabilityValue( value: any, capability: any ): string {
    if ( value === null || value === undefined ) return '—';
    
    if ( typeof value === 'boolean' ) {
      return value ? 'On' : 'Off';
    }
    
    if ( typeof value === 'number' ) {
      const decimals = capability?.decimals || 1;
      const units = capability?.units || '';
      return `${value.toFixed( decimals )}${units}`;
    }
    
    return String( value );
  }
}

// Export singleton instance
export const homeyApi = new HomeyApiService();
