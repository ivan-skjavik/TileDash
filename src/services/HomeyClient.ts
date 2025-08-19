import { AthomCloudAPI, HomeyAPIV3Local } from 'homey-api';
import { HomeyDevice } from '../types';
import { TokenStorage } from './TokenStorage';
import { URLManager } from '../utils';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class HomeyClient {
  private api: AthomCloudAPI | null = null;
  public homeyApi: HomeyAPIV3LocalPatched | null = null;
  private homey: AthomCloudAPI.Homey | null = null;
  private isConnected: boolean = false;
  private CLIENT_ID = '68a4480a49ea3fdd32f34e00'; // TODO store in .env
  private CLIENT_SECRET = '4976498ae7a1851c3e1abb3fa60eeb44'; // TODO store in .env
  private REDIRECT_URL = 'http://localhost:3000/auth/callback'; // Use Vite dev server with proxy // TODO store in .env

  /**
   * Initialize OAuth flow or connect with existing token
   */
  async initializeAuth(): Promise<boolean> {
    try {
      console.log( '🔐 Initializing Homey authentication...' );

      // Check for OAuth callback parameters first
      const authCode = URLManager.getAuthorizationCode();
      const authError = URLManager.getAuthError();

      if ( authError ) {
        console.error( '❌ OAuth error:', authError );
        URLManager.clearOAuthParams();
        // TODO show some error popup to users
        throw new Error( `OAuth authentication failed: ${authError}` );
      }

      if ( authCode ) {
        console.log( '🔑 Found authorization code, exchanging for token...', authCode );
        URLManager.clearOAuthParams();
        return await this.authenticateWithCode( authCode );
      }

      // Check for existing valid token using AthomCloudAPI's built-in storage
      if ( TokenStorage.hasValidToken() ) {
        console.log( '🔑 Found existing token, attempting to connect...' );
        return await this.connectWithToken();
      }

      // No token found, start OAuth flow
      console.log( '🚀 No token found, starting OAuth flow...' );
      await this.startOAuthFlow();
      return false; // Will redirect, so return false
      
    } catch ( error ) {
      console.error( '❌ Failed to initialize authentication:', error );
      return false;
    }
  }

  /**
   * Start OAuth authorization flow
   */
  private async startOAuthFlow(): Promise<void> {
    this.api = new AthomCloudAPI( {
      clientId: this.CLIENT_ID,
      clientSecret: this.CLIENT_SECRET,
      redirectUrl: this.REDIRECT_URL,
    } );

    // Get login URL and redirect
    const loginUrl = this.api.getLoginUrl();
    console.log( '🔗 Redirecting to:', loginUrl );
    window.location.href = loginUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  private async authenticateWithCode( authCode: string ): Promise<boolean> {
    console.log('authenticateWithCode', authCode);
    
    try {
      this.api = new AthomCloudAPI( {
        clientId: this.CLIENT_ID,
        clientSecret: this.CLIENT_SECRET,
        redirectUrl: this.REDIRECT_URL,
      } );

      // Set the authorization code in the URL for the API to pick up
      const currentUrl = new URL( window.location.href );
      currentUrl.searchParams.set( 'code', authCode );
      window.history.replaceState( {}, '', currentUrl.toString() );

      // Exchange authorization code for token
      await this.api.authenticateWithAuthorizationCode();
      
      // Clean up URL
      URLManager.clearOAuthParams();

      // Token is automatically saved by AthomCloudAPI to localStorage under 'homey-api' key
      console.log( '✅ Token obtained and saved automatically by AthomCloudAPI' );
      
      // Now connect with the token
      return await this.connectWithToken();
      
    } catch ( error ) {
      console.error( '❌ Failed to authenticate with authorization code:', error );
      throw error;
    }
  }

  /**
   * Connect using AthomCloudAPI's stored token
   */
  private async connectWithToken(): Promise<boolean> {
    try {
      console.log( '🔌 Connecting with stored token...' );
      
      this.api = new AthomCloudAPI( {
        clientId: this.CLIENT_ID,
        clientSecret: this.CLIENT_SECRET,
        redirectUrl: this.REDIRECT_URL,
      } );

      // Verify token is still valid
      const loggedIn = await this.api.isLoggedIn();
      if ( !loggedIn ) {
        console.log( '🔑 Token expired or invalid, restarting auth flow...' );
        TokenStorage.removeToken();
        await this.startOAuthFlow();
        return false;
      }

      // Get user and Homey
      const user = await this.api.getAuthenticatedUser();
      this.homey = await user.getFirstHomey();

      // Authenticate with Homey using the local strategy
      this.homeyApi = await this.homey.authenticate() as HomeyAPIV3LocalPatched;

      console.log('homeyApi', this.homeyApi);
      
      // Add wrapper methods to the HomeyAPI instance for backward compatibility
      this.addWrapperMethods();

    //   // Connect to Homey and wait for managers to be initialized
    //   await this.homeyApi.connect();

      this.isConnected = true;
      console.log( '✅ Successfully connected to Homey:', this.homey.id );
      
      // Log available properties to understand the API structure
      console.log( '🔧 API properties:', Object.getOwnPropertyNames(this.homeyApi).filter(prop => !prop.startsWith('_')) );
      
      return true;
      
    } catch ( error ) {
      console.log( '❌ Failed to connect with token:', error );
      // If connection fails, remove the token and restart auth
      TokenStorage.removeToken();
      throw error;
    }
  }

  /**
   * Add wrapper methods to the HomeyAPI instance for backward compatibility
   */
  private addWrapperMethods(): void {
    if (!this.homeyApi) return;

    // Add setCapabilityValue method directly to the API instance
    (this.homeyApi as any).setCapabilityValue = async (deviceId: string, capabilityId: string, value: any) => {
      return await this.setCapabilityValue(deviceId, capabilityId, value);
    };

    // Add triggerFlow method directly to the API instance
    (this.homeyApi as any).triggerFlow = async (flowId: string, tokens?: { [key: string]: any }) => {
      return await this.triggerFlow(flowId, tokens);
    };

    // Add addDeviceListener method directly to the API instance
    (this.homeyApi as any).addDeviceListener = async (deviceId: string, capabilityId: string, callback: (newValue: any, oldValue: any) => void) => {
      return await this.addDeviceListener(deviceId, capabilityId, callback);
    };

    // Add removeDeviceListener method directly to the API instance
    (this.homeyApi as any).removeDeviceListener = async (deviceId: string, capabilityId: string, callback: (newValue: any, oldValue: any) => void) => {
      return await this.removeDeviceListener(deviceId, capabilityId, callback);
    };

    console.log('✅ Added wrapper methods to HomeyAPI instance');
  }

  async getDevices(): Promise<HomeyDevice[]> {
    if ( !this.isConnected || !this.homeyApi ) {
      throw new Error( 'Not connected to Homey' );
    }

    try {      
      const devices = await this.homeyApi.devices.getDevices();
      // Convert HomeyAPI Device objects to our HomeyDevice interface
      return Object.values( devices ).map( device => this.convertToHomeyDevice( device ) );
    } catch ( error ) {
      console.error( 'Failed to get devices:', error );
      throw error;
    }
  }

  /**
   * Convert a HomeyAPI Device to our HomeyDevice interface
   */
  private convertToHomeyDevice( device: any ): HomeyDevice {
    return {
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
  }

  async getDevice( deviceId: string ): Promise<HomeyAPIV3Local.ManagerDevices.Device | null> {
    if ( !this.isConnected || !this.homeyApi ) {
      throw new Error( 'Not connected to Homey' );
    }

    try {
      return await this.homeyApi.devices.getDevice( { id: deviceId } );
    } catch ( error ) {
      console.error( `Failed to get device ${deviceId}:`, error );
      return null;
    }
  }

  async setDeviceCapabilityValue( deviceId: string, capabilityId: string, value: any ): Promise<boolean> {
    if ( !this.isConnected || !this.homeyApi ) {
      throw new Error( 'Not connected to Homey' );
    }

    try {
      const device = await this.homeyApi.devices.getDevice( { id: deviceId } );
      await device.setCapabilityValue( { capabilityId, value } );
      return true;
    } catch ( error ) {
      console.error( `Failed to set device capability:`, error );
      return false;
    }
  }

  /**
   * Set capability value for a device (alias for setDeviceCapabilityValue for backward compatibility)
   */
  async setCapabilityValue( deviceId: string, capabilityId: string, value: any ): Promise<void> {
    if ( !this.isConnected || !this.homeyApi ) {
      throw new Error( 'Not connected to Homey' );
    }

    try {
      await this.homeyApi.devices.setCapabilityValue( {
        deviceId: deviceId,
        capabilityId: capabilityId,
        value: value
      } );
      console.log( `✅ Set capability value: ${deviceId}:${capabilityId} = ${value}` );
    } catch ( error ) {
      console.error( `❌ Failed to set capability value: ${deviceId}:${capabilityId} = ${value}`, error );
      throw error;
    }
  }

  /**
   * Trigger a flow by ID
   */
  async triggerFlow( flowId: string, _tokens?: { [key: string]: any } ): Promise<void> {
    if ( !this.isConnected || !this.homeyApi ) {
      throw new Error( 'Not connected to Homey' );
    }

    try {
      // Try regular flow first
      await this.homeyApi.flow.triggerFlow( { id: flowId } );
      console.log( `✅ Triggered flow: ${flowId}` );
    } catch ( flowError ) {
      try {
        // If regular flow fails, try advanced flow
        await this.homeyApi.flow.triggerAdvancedFlow( { id: flowId } );
        console.log( `✅ Triggered advanced flow: ${flowId}` );
      } catch ( advancedFlowError ) {
        console.error( `❌ Failed to trigger flow or advanced flow: ${flowId}`, { flowError, advancedFlowError } );
        throw advancedFlowError;
      }
    }
  }

  onDeviceUpdate( _callback: ( device: HomeyDevice ) => void ): void {
    if ( !this.homeyApi ) return;

    // Device updates are typically handled through capability listeners
    // This is a placeholder for system-level device update events
    console.log( '🔄 Device update listener registered (placeholder)' );
  }

  onDeviceCreate( _callback: ( device: HomeyDevice ) => void ): void {
    if ( !this.homeyApi ) return;

    console.log( '🔄 Device create listener registered (placeholder)' );
  }

  onDeviceDelete( _callback: ( device: HomeyDevice ) => void ): void {
    if ( !this.homeyApi ) return;

    console.log( '🔄 Device delete listener registered (placeholder)' );
  }

  /**
   * Add a listener for device capability changes
   */
  async addDeviceListener( deviceId: string, capabilityId: string, callback: ( newValue: any, oldValue: any ) => void ): Promise<void> {
    if ( !this.homeyApi ) return;
    
    try {
      const device = await this.homeyApi.devices.getDevice( { id: deviceId } );
      // The makeCapabilityInstance callback only receives the new value
      device.makeCapabilityInstance( capabilityId, ( newValue: any ) => {
        // We don't have access to the old value in this API, so pass undefined
        callback( newValue, undefined );
      } );
      console.log( `✅ Added listener for ${deviceId}:${capabilityId}` );
    } catch ( error ) {
      console.error( `❌ Failed to add device listener: ${deviceId}:${capabilityId}`, error );
    }
  }

  /**
   * Remove a listener for device capability changes
   */
  async removeDeviceListener( deviceId: string, capabilityId: string, _callback: ( newValue: any, oldValue: any ) => void ): Promise<void> {
    if ( !this.homeyApi ) return;
    
    try {
      // The homey API doesn't seem to have a direct way to remove specific capability listeners
      // This would need to be handled differently, perhaps by maintaining a registry
      console.log( `🔄 Remove listener for ${deviceId}:${capabilityId} (method not fully implemented)` );
    } catch ( error ) {
      console.error( `❌ Failed to remove device listener: ${deviceId}:${capabilityId}`, error );
    }
  }

  disconnect(): void {
    // The HomeyAPI doesn't have a standard disconnect method in the types
    // Just clean up our references
    this.isConnected = false;
    this.api = null;
    this.homeyApi = null;
  }

  isApiConnected(): boolean {
    return this.isConnected;
  }

  getHomeyInfo(): any {
    return this.homey ? {
      id: this.homey.id || 'unknown',
      isConnected: this.homeyApi?.isConnected ? this.homeyApi.isConnected() : this.isConnected
    } : null;
  }
}

export default HomeyClient;
