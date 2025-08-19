import { AthomCloudAPI, HomeyAPIV3Local } from 'homey-api';
import { HomeyDevice } from '../types';
import { TokenStorage } from './TokenStorage';
import { URLManager } from '../utils';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class HomeyClient {
  private api: AthomCloudAPI | null = null;
  private homeyApi: HomeyAPIV3LocalPatched | null = null;
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
      

    //   // Connect to Homey and wait for managers to be initialized
    //   await this.homeyApi.connect();

      this.isConnected = true;
      console.log( '✅ Successfully connected to Homey:', this.homey.id );
      
      // Log available properties to understand the API structure
      console.log( '🔧 API properties:', Object.getOwnPropertyNames(this.homeyApi).filter(prop => !prop.startsWith('_')) );
      
      return true;
      
    } catch ( error ) {
      console.error( '❌ Failed to connect with token:', error );
      // If connection fails, remove the token and restart auth
      TokenStorage.removeToken();
      throw error;
    }
  }

  async getDevices(): Promise<HomeyAPIV3Local.ManagerDevices.Device[]> {
    if ( !this.isConnected || !this.homeyApi ) {
      throw new Error( 'Not connected to Homey' );
    }

    try {      
      const devices = await this.homeyApi.devices.getDevices();
      return Object.values( devices );
    } catch ( error ) {
      console.error( 'Failed to get devices:', error );
      throw error;
    }
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

  onDeviceUpdate( callback: ( device: HomeyDevice ) => void ): void {
    if ( !this.homeyApi ) return;

    this.homeyApi.devices.on( 'device.update', callback );
  }

  onDeviceCreate( callback: ( device: HomeyDevice ) => void ): void {
    if ( !this.homeyApi ) return;

    this.homeyApi.devices.on( 'device.create', callback );
  }

  onDeviceDelete( callback: ( device: HomeyDevice ) => void ): void {
    if ( !this.homeyApi ) return;

    this.homeyApi.devices.on( 'device.delete', callback );
  }

  disconnect(): void {
    if ( this.homeyApi ) {
      this.homeyApi.disconnect();
    }
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
