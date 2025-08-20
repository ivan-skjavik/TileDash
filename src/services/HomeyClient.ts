import { AthomCloudAPI, HomeyAPIV3Local } from 'homey-api';
import { HomeyDevice } from '../types';
import { TokenStorage } from './TokenStorage';
import { URLManager } from '../utils';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class HomeyClient {
	private api: AthomCloudAPI | null = null;
	private homeyApi: HomeyAPIV3LocalPatched | null = null;
	private homey: AthomCloudAPI.Homey | null = null;
	public isConnected: boolean = false;
	private CLIENT_ID: string;
	private CLIENT_SECRET: string;
	private REDIRECT_URL: string;

	constructor() {
		// Load OAuth credentials from environment variables
		this.CLIENT_ID = import.meta.env.VITE_HOMEY_CLIENT_ID || '';
		this.CLIENT_SECRET = import.meta.env.VITE_HOMEY_CLIENT_SECRET || '';
		this.REDIRECT_URL = import.meta.env.VITE_HOMEY_REDIRECT_URL || 'http://localhost:3000/auth/callback';

		// Validate that required credentials are available
		if ( !this.CLIENT_ID || !this.CLIENT_SECRET ) {
			throw new Error( 
				'Homey OAuth credentials are required. Please set VITE_HOMEY_CLIENT_ID and VITE_HOMEY_CLIENT_SECRET in your .env file.'
			);
		}

		console.log( '🔐 HomeyClient initialized with environment credentials' );
	}

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
		console.log( 'authenticateWithCode', authCode );
    
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

			console.log( 'homeyApi', this.homeyApi );
      
			this.isConnected = true;
			console.log( '✅ Successfully connected to Homey:', this.homey.id );
      
			// Log available properties to understand the API structure
			console.log( '🔧 API properties:', Object.getOwnPropertyNames( this.homeyApi ).filter( prop => !prop.startsWith( '_' ) ) );
      
			return true;
      
		} catch ( error ) {
			console.log( '❌ Failed to connect with token:', error );
			// If connection fails, remove the token and restart auth
			TokenStorage.removeToken();
			throw error;
		}
	}

	/**
    * Get the connected HomeyAPI instance
    * Throws an error if not connected to ensure type safety
    */
	public getApi(): HomeyAPIV3LocalPatched {
		if ( !this.homeyApi || !this.isConnected ) {
			throw new Error( 'HomeyClient is not connected. Call initializeAuth() first.' );
		}
		return this.homeyApi;
	}

	async getDevices(): Promise<HomeyDevice[]> {
		const api = this.getApi();
    
		try {      
			const devices = await api.devices.getDevices();
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
			ownerName: device.ownerName,
		};
	}

	async getDevice( deviceId: string ): Promise<HomeyAPIV3Local.ManagerDevices.Device | null> {
		const api = this.getApi();
    
		try {
			return await api.devices.getDevice( { id: deviceId, } );
		} catch ( error ) {
			console.error( `Failed to get device ${deviceId}:`, error );
			return null;
		}
	}

	/**
    * Set capability value for a device using the direct HomeyAPI method
    */
	async setCapabilityValue( deviceId: string, capabilityId: string, value: any ): Promise<void> {
		const api = this.getApi();
    
		try {
			await api.devices.setCapabilityValue( {
				deviceId: deviceId,
				capabilityId: capabilityId,
				value: value,
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
		const api = this.getApi();
    
		try {
			// Try regular flow first
			await api.flow.triggerFlow( { id: flowId, } );
			console.log( `✅ Triggered flow: ${flowId}` );
		} catch ( flowError ) {
			try {
				// If regular flow fails, try advanced flow
				await api.flow.triggerAdvancedFlow( { id: flowId, } );
				console.log( `✅ Triggered advanced flow: ${flowId}` );
			} catch ( advancedFlowError ) {
				console.error( `❌ Failed to trigger flow or advanced flow: ${flowId}`, { flowError, advancedFlowError, } );
				throw advancedFlowError;
			}
		}
	}

	onDeviceUpdate( _callback: ( device: HomeyDevice ) => void ): void {
		this.getApi(); // Ensure we're connected
    
		// Device updates are typically handled through capability listeners
		// This is a placeholder for system-level device update events
		console.log( '---------🔄 Device update listener registered (placeholder)' );
	}

	onDeviceCreate( _callback: ( device: HomeyDevice ) => void ): void {
		this.getApi(); // Ensure we're connected
    
		console.log( '---------🔄 Device create listener registered (placeholder)' );
	}

	onDeviceDelete( _callback: ( device: HomeyDevice ) => void ): void {
		this.getApi(); // Ensure we're connected
    
		console.log( '---------🔄 Device delete listener registered (placeholder)' );
	}

	/**
   * Add a listener for device capability changes
   */
	async addDeviceListener( deviceId: string, capabilityId: string, callback: ( newValue: any, oldValue: any ) => void ): Promise<void> {
		const api = this.getApi();
    
		try {
			const device = await api.devices.getDevice( { id: deviceId, } );
			// The makeCapabilityInstance callback only receives the new value
			device.makeCapabilityInstance( capabilityId, ( newValue: any ) => {
				// We don't have access to the old value in this API, so pass undefined
				console.log( 'callbackz' );
                
				callback( newValue, undefined );
			} );
			console.log( `✅ Added listener for ${deviceId}:${capabilityId}` );
		} catch ( error ) {
			console.error( `❌ Failed to add device listener: ${deviceId}:${capabilityId}`, error );
			throw error;
		}
	}

	/**
   * Remove a listener for device capability changes
   */
	async removeDeviceListener( deviceId: string, capabilityId: string, _callback: ( newValue: any, oldValue: any ) => void ): Promise<void> {
		this.getApi(); // Ensure we're connected
    
		try {
			// The homey API doesn't seem to have a direct way to remove specific capability listeners
			// This would need to be handled differently, perhaps by maintaining a registry
			console.log( `🔄 Remove listener for ${deviceId}:${capabilityId} (method not fully implemented)` );
		} catch ( error ) {
			console.error( `❌ Failed to remove device listener: ${deviceId}:${capabilityId}`, error );
			throw error;
		}
	}
}

export default HomeyClient;
