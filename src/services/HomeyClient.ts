import { AthomCloudAPI, HomeyAPIV3Local } from 'homey-api';
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
	public _devices = new Map<string, HomeyAPIV3Local.ManagerDevices.Device>();

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

	public get devices() {
		return this._devices;
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

			await this.getDevices();

			return true;
      
		} catch ( error ) {
			console.log( '❌ Failed to connect with token:', error );
			// If connection fails, remove the token and restart auth
			TokenStorage.removeToken();
			throw error;
		}
	}


	public getDeviceFromMap( deviceId: string ) {
		return this._devices.get( deviceId ) || null;
	}

	// Fetch all devices for metadata (e.g., device names)
	private async getDevices( ) {
		try {
			const api = this.getApi();

			const devices = await api.devices.getDevices();

			// insert all devices into this.devices 
			for ( const [ deviceId, device, ] of Object.entries( devices ) ) {
				this._devices.set( deviceId, device );
			}

		} catch ( error ) {
			console.error( 'Error fetching devices:', error );
			return {};
		}
	}

	/**
    * Get the connected HomeyAPI instance
    * Throws an error if not connected to ensure type safety
    */
	public getApi() {
		if ( !this.homeyApi || !this.isConnected ) {
			throw new Error( 'HomeyClient is not connected. Call initializeAuth() first.' );
		}
		return this.homeyApi;
	}

	// /**
	// * Convert a HomeyAPI Device to our HomeyDevice interface
	// */
	// private convertToHomeyDevice( device: any ): HomeyDevice {
	// 	return {
	// 		id: device.id,
	// 		name: device.name,
	// 		iconObj: device.iconObj,
	// 		ui: device.ui,
	// 		capabilitiesObj: device.capabilitiesObj || {},
	// 		capabilities: device.capabilities || [],
	// 		class: device.class,
	// 		energy: device.energy,
	// 		settings: device.settings,
	// 		store: device.store,
	// 		flags: device.flags,
	// 		driverUri: device.driverUri,
	// 		zone: device.zone,
	// 		driverId: device.driverId,
	// 		ownerName: device.ownerName,
	// 	};
	// }

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
}

export default HomeyClient;
