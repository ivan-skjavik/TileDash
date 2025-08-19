import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import db, { queries } from './dist/database.js';

// Load environment variables
dotenv.config();

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const app = express();
const port = process.env.PORT || 3010;

app.use( express.json() );
app.use( express.static( '.' ) );

// API Routes

// Get dashboard configuration
app.get( '/api/dashboard/config', ( _req, res ) => {
  try {
    const activeConfig = queries.getActiveDashboardConfig.get();
    if ( activeConfig ) {
      res.json( JSON.parse( activeConfig.config ) );
    } else {
      res.status( 404 ).json( { error: 'No active dashboard configuration found' } );
    }
  } catch ( error ) {
    console.error( 'Error getting dashboard config:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Save dashboard configuration
app.post( '/api/dashboard/config', ( req, res ) => {
  try {
    const config = req.body;
    const configName = req.query.name || 'default';
    
    queries.saveDashboardConfig.run( configName, JSON.stringify( config ), 1 );
    queries.setActiveDashboard.run( configName );
    
    res.json( { success: true } );
  } catch ( error ) {
    console.error( 'Error saving dashboard config:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Log device changes
app.post( '/api/devices/log', ( req, res ) => {
  try {
    const { device_id, device_name, capability_id, old_value, new_value } = req.body;
    
    queries.logDeviceChange.run( device_id, device_name || null, capability_id, old_value || null, new_value );
    
    res.json( { success: true } );
  } catch ( error ) {
    console.error( 'Error logging device change:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Get device history
app.get( '/api/devices/:deviceId/history', ( req, res ) => {
  try {
    const { deviceId } = req.params;
    const { capabilityId, limit = '100' } = req.query;
    
    if ( !capabilityId ) {
      return res.status( 400 ).json( { error: 'capabilityId parameter is required' } );
    }
    
    const history = queries.getDeviceHistory.all( deviceId, capabilityId, parseInt( limit ) );
    res.json( history );
  } catch ( error ) {
    console.error( 'Error getting device history:', error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }
} );

// Get settings
app.get( '/api/settings/:key', ( req, res ) => {
  try {
    const { key } = req.params;
    const setting = queries.getSetting.get( key );
    
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
app.put( '/api/settings/:key', ( req, res ) => {
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
app.get( '/api/health', ( _req, res ) => {
  res.json( { status: 'ok', timestamp: new Date().toISOString() } );
} );

// Get environment token
app.get( '/api/env/token', ( _req, res ) => {
  const token = process.env.HOMEY_TOKEN;
  res.json( { token: token || null } );
} );

// Serve main HTML file for all non-API routes
app.get( '*', ( _req, res ) => {
  res.sendFile( join( __dirname, 'index.html' ) );
} );

// Cleanup old logs periodically (every hour)
setInterval( () => {
  try {
    queries.cleanupOldLogs.run();
    console.log( 'Old device logs cleaned up' );
  } catch ( error ) {
    console.error( 'Error cleaning up old logs:', error );
  }
}, 60 * 60 * 1000 );

app.listen( port, () => {
  console.log( `TileDash development server running at http://localhost:${port}` );
} );

export default app;
