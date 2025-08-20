import { AthomCloudAPI } from "homey-api";

export class TokenStorage {
  private static readonly HOMEY_API_TOKEN_KEY = 'homey-api';

  /**
   * Check if AthomCloudAPI has a valid token stored
   */
  static hasValidToken(): boolean {
    try {
      const tokenData = localStorage.getItem( this.HOMEY_API_TOKEN_KEY );
      if ( !tokenData ) {
        return false;
      }

      const parsedData = JSON.parse( tokenData );
      // Check if we have token data with an access_token
      return !!( parsedData && parsedData.token && parsedData.token.access_token );
    } catch ( error ) {
      console.error( 'Failed to check token validity:', error );
      return false;
    }
  }

  /**
   * Get token information (for debugging/display purposes)
   */
  static getTokenInfo(): any {
    try {
      const tokenData = localStorage.getItem( this.HOMEY_API_TOKEN_KEY );
      if ( !tokenData ) {
        return null;
      }

      const parsedData = JSON.parse( tokenData );
      return parsedData.token || null;
    } catch ( error ) {
      console.error( 'Failed to get token info:', error );
      return null;
    }
  }

  /**
   * Clear the AthomCloudAPI token (logout)
   */
  static removeToken(): void {
    try {
      localStorage.removeItem( this.HOMEY_API_TOKEN_KEY );
      console.log( '🔑 Homey API token cleared from localStorage' );
    } catch ( error ) {
      console.error( 'Failed to remove token from localStorage:', error );
    }
  }

  /**
   * Check if we're currently logged in by creating a temporary API instance
   */
  static async checkLoginStatus( clientId: string, clientSecret: string ): Promise<boolean> {
    try {
      const tempApi = new AthomCloudAPI( {
        clientId,
        clientSecret,
        redirectUrl: 'http://localhost:3000' // Dummy URL for checking
      } );

      return await tempApi.isLoggedIn();
    } catch ( error ) {
      console.error( 'Failed to check login status:', error );
      return false;
    }
  }
}
