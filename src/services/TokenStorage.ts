import { AthomCloudAPI } from "homey-api";

export class TokenStorage {
  private static readonly TOKEN_KEY = 'homey_auth_token';
  private static readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

  /**
   * Save token to localStorage
   */
  static saveToken( token: AthomCloudAPI.Token ): void {
    try {
      localStorage.setItem( this.TOKEN_KEY, JSON.stringify( token ) );
      console.log( '🔑 Token saved to localStorage' );
    } catch ( error ) {
      console.error( 'Failed to save token to localStorage:', error );
    }
  }

  /**
   * Get token from localStorage
   */
  static getToken(): AthomCloudAPI.Token | null {
    try {
      const tokenStr = localStorage.getItem( this.TOKEN_KEY );
      if ( !tokenStr ) {
        return null;
      }
      
      const token: AthomCloudAPI.Token = JSON.parse( tokenStr );
      
      // Check if token is expired (with buffer)
      if ( token.expires_in && Date.now() > ( Date.now() + ( token.expires_in * 1000 ) - this.TOKEN_EXPIRY_BUFFER ) ) {
        console.log( '🔑 Token expired, removing from storage' );
        this.removeToken();
        return null;
      }
      
      return token;
    } catch ( error ) {
      console.error( 'Failed to get token from localStorage:', error );
      return null;
    }
  }

  /**
   * Remove token from localStorage
   */
  static removeToken(): void {
    try {
      localStorage.removeItem( this.TOKEN_KEY );
      console.log( '🔑 Token removed from localStorage' );
    } catch ( error ) {
      console.error( 'Failed to remove token from localStorage:', error );
    }
  }

  /**
   * Check if we have a valid token
   */
  static hasValidToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Update token expiry time
   */
  static updateTokenExpiry( token: AthomCloudAPI.Token, expiresInSeconds?: number ): AthomCloudAPI.Token {
    if ( expiresInSeconds ) {
      token.expires_in = expiresInSeconds;
    }
    return token;
  }
}
