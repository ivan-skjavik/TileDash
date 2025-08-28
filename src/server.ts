import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

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
		const { code, state, error, } = req.query;
    
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

// Health check
app.get( '/api/health', ( _req: Request, res: Response ) => {
	res.json( { status: 'ok', timestamp: new Date().toISOString(), } );
} );

// Serve main HTML file for all non-API routes
app.get( '*', ( _req: Request, res: Response ) => {
	res.sendFile( join( __dirname, '../index.html' ) );
} );

app.listen( port, () => {
	console.log( `TileDash backend server running at http://localhost:${port}` );
} );

export default app;
