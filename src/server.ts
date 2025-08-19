import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { queries } from './server-database';

// Load environment variables
dotenv.config();

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const app = express();
const port = process.env.PORT || 3010;

app.use( express.json() );
app.use( express.static( '.' ) );

// API Routes

// OAuth callback route
app.get( '/auth/callback', ( req: Request, res: Response ) => {
  try {
    const { code, state, error } = req.query;
    
    if ( error ) {
      console.error( 'OAuth error:', error );
      // Redirect back to main app with error
      res.redirect( `/?auth_error=${encodeURIComponent( error as string )}` );
      return;
    }
    
    if ( code ) {
      // Store the authorization code temporarily and redirect back to main app
      // The client-side code will pick this up and exchange it for a token
      res.redirect( `/?auth_code=${encodeURIComponent( code as string )}${state ? `&state=${encodeURIComponent( state as string )}` : ''}` );
    } else {
      res.redirect( '/?auth_error=missing_code' );
    }
  } catch ( error ) {
    console.error( 'Error in OAuth callback:', error );
    res.redirect( '/?auth_error=callback_error' );
  }
} );

// Get dashboard configuration
app.get( '/api/dashboard/config', ( _req: Request, res: Response ) => {
  try {
    const activeConfig = queries.getDashboardConfig.get( 'default' ) as { config: string } | undefined;
    if ( activeConfig ) {
      res.json( JSON.parse( activeConfig.config ) );
    } else {
      res.status( 404 ).json( { error: 'No dashboard configuration found' } );
    }
  } catch ( error ) {
    console.error( 'Error getting dashboard config:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Save dashboard configuration
app.post( '/api/dashboard/config', ( req: Request, res: Response ) => {
  try {
    const config = req.body;
    const configName = req.query.name as string || 'default';
    
    queries.saveDashboardConfig.run( configName, JSON.stringify( config ) );
    
    res.json( { success: true } );
  } catch ( error ) {
    console.error( 'Error saving dashboard config:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Log device changes
app.post( '/api/devices/log', ( req: Request, res: Response ) => {
  try {
    const { device_id, capability_id, old_value, new_value } = req.body;
    
    queries.logDeviceChange.run( device_id, capability_id, old_value || null, new_value );
    
    res.json( { success: true } );
  } catch ( error ) {
    console.error( 'Error logging device change:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Get device history
app.get( '/api/devices/:deviceId/history', ( req: Request, res: Response ) => {
  try {
    const { deviceId } = req.params;
    const { capabilityId, limit = '100' } = req.query;
    
    if ( !capabilityId ) {
      return res.status( 400 ).json( { error: 'capabilityId parameter is required' } );
    }
    
    const history = queries.getDeviceLogs.all( deviceId, parseInt( limit as string ) );
    res.json( history );
  } catch ( error ) {
    console.error( 'Error getting device history:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Get settings
app.get( '/api/settings/:key', ( req: Request, res: Response ) => {
  try {
    const { key } = req.params;
    const setting = queries.getSetting.get( key ) as { value: string } | undefined;
    
    if ( setting ) {
      res.json( { key, value: setting.value } );
    } else {
      res.status( 404 ).json( { error: 'Setting not found' } );
    }
  } catch ( error ) {
    console.error( 'Error getting setting:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Set settings
app.put( '/api/settings/:key', ( req: Request, res: Response ) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    queries.setSetting.run( key, value );
    res.json( { success: true } );
  } catch ( error ) {
    console.error( 'Error setting value:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Health check
app.get( '/api/health', ( _req: Request, res: Response ) => {
  res.json( { status: 'ok', timestamp: new Date().toISOString() } );
} );

// Get environment token
app.get( '/api/env/token', ( _req: Request, res: Response ) => {
  const token = process.env.HOMEY_TOKEN;
  res.json( { token: token || null } );
} );

// Serve main HTML file for all non-API routes
app.get( '*', ( _req: Request, res: Response ) => {
  res.sendFile( join( __dirname, '../index.html' ) );
} );

// Cleanup old logs periodically (every hour)
setInterval( () => {
  try {
    queries.cleanOldLogs.run();
    console.log( 'Old device logs cleaned up' );
  } catch ( error ) {
    console.error( 'Error cleaning up old logs:', error );
  }
}, 60 * 60 * 1000 );

app.listen( port, () => {
  console.log( `TileDash development server running at http://localhost:${port}` );
} );

export default app;
