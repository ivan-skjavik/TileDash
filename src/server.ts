import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const app = express();
const port = process.env.PORT || 3010;

// RTSP Stream Configuration
interface StreamQuality {
	resolution: string;
	bitrate: string;
	fps: number;
}

interface StreamConfig {
	rtspUrl: string;
	username?: string;
	password?: string;
	quality: StreamQuality;
}

// Default quality presets
const QUALITY_PRESETS: Record<string, StreamQuality> = {
	low: { resolution: '640x480', bitrate: '500k', fps: 15, },
	medium: { resolution: '1280x720', bitrate: '1500k', fps: 20, },
	high: { resolution: '1920x1080', bitrate: '3000k', fps: 25, },
	ultra: { resolution: '1920x1080', bitrate: '6000k', fps: 30, },
};

// Active streams management
class StreamManager {
	private streams: Map<string, { process: ChildProcess; lastAccess: number; config: StreamConfig; clients: Set<Response> }> = new Map();
	private cleanupInterval: NodeJS.Timeout;
	private streamDir: string;

	constructor() {
		this.streamDir = join( __dirname, '../public/streams' );
		this.ensureStreamDirectory();
		
		// Cleanup inactive streams every 30 seconds
		this.cleanupInterval = setInterval( () => {
			this.cleanupInactiveStreams();
		}, 30000 );

		// Cleanup on process exit
		process.on( 'exit', () => this.cleanup() );
		process.on( 'SIGINT', () => this.cleanup() );
		process.on( 'SIGTERM', () => this.cleanup() );
	}

	private ensureStreamDirectory(): void {
		if ( !existsSync( this.streamDir ) ) {
			mkdirSync( this.streamDir, { recursive: true, } );
		}
	}

	private generateStreamId( rtspUrl: string, quality: string ): string {
		// Create a unique ID based on URL and quality
		const hash = Buffer.from( `${rtspUrl}_${quality}` ).toString( 'base64' )
			.replace( /[/+=]/g, '' )
			.substring( 0, 16 );
		return hash;
	}

	public startStream( streamId: string, config: StreamConfig ): boolean {
		try {
			// Check if stream already exists
			if ( this.streams.has( streamId ) ) {
				const stream = this.streams.get( streamId );
				if ( stream ) {
					stream.lastAccess = Date.now();
					console.log( `📹 Reusing existing stream: ${streamId}` );
					return true;
				}
			}

			console.log( `📹 Starting FFmpeg stream: ${streamId}` );
			
			// Prepare FFmpeg arguments
			const args = this.buildFFmpegArgs( config );
			
			console.log( `🚀 Spawning FFmpeg process with ${args.length} arguments` );
			
			// Start FFmpeg process
			const ffmpegProcess = spawn( 'ffmpeg', args, {
				stdio: [ 'pipe', 'pipe', 'pipe', ], // Capture all streams
			} );
			
			console.log( `🚀 FFmpeg process started with PID: ${ffmpegProcess.pid}` );
			
			// Buffer to collect MJPEG frames
			let frameBuffer = Buffer.alloc( 0 );
			const JPEG_START_MARKER = Buffer.from( [ 0xFF, 0xD8, ] ); // JPEG SOI marker
			const JPEG_END_MARKER = Buffer.from( [ 0xFF, 0xD9, ] ); // JPEG EOI marker
			
			// Handle stdout data (MJPEG frames)
			ffmpegProcess.stdout?.on( 'data', ( data: Buffer ) => {
				frameBuffer = Buffer.concat( [ frameBuffer, data, ] );
				
				// Look for complete JPEG frames
				let startIndex = 0;
				// eslint-disable-next-line no-constant-condition
				while ( true ) {
					const jpegStart = frameBuffer.indexOf( JPEG_START_MARKER, startIndex );
					if ( jpegStart === -1 ) break;
					
					const jpegEnd = frameBuffer.indexOf( JPEG_END_MARKER, jpegStart + 2 );
					if ( jpegEnd === -1 ) break;
					
					// Extract complete JPEG frame
					const frame = frameBuffer.subarray( jpegStart, jpegEnd + 2 );
					
					// Broadcast frame to all clients
					this.broadcastFrame( streamId, frame );
					
					startIndex = jpegEnd + 2;
				}
				
				// Keep remaining incomplete data
				if ( startIndex > 0 ) {
					frameBuffer = frameBuffer.subarray( startIndex );
				}
			} );
			
			// Handle process events
			ffmpegProcess.stderr?.on( 'data', ( data ) => {
				const output = data.toString();
				// Only log important messages to reduce noise
				if ( output.includes( 'error' ) || output.includes( 'failed' ) || output.includes( 'Connection' ) ) {
					console.log( `📺 FFmpeg stderr ${streamId}: ${output.trim()}` );
				}
			} );

			ffmpegProcess.on( 'close', ( code ) => {
				console.log( `📹 FFmpeg process ${streamId} exited with code ${code}` );
				this.streams.delete( streamId );
				this.cleanupStreamFiles( streamId );
			} );

			ffmpegProcess.on( 'error', ( error ) => {
				console.error( `❌ FFmpeg error for ${streamId}:`, error );
				this.streams.delete( streamId );
				this.cleanupStreamFiles( streamId );
			} );

			// Store stream info
			this.streams.set( streamId, {
				process: ffmpegProcess,
				lastAccess: Date.now(),
				config,
				clients: new Set(),
			} );

			return true;
		} catch ( error ) {
			console.error( `❌ Failed to start stream ${streamId}:`, error );
			return false;
		}
	}

	private buildFFmpegArgs( config: StreamConfig ): string[] {
		const { rtspUrl, username, password, quality, } = config;
		
		// Build RTSP URL with authentication if provided
		let inputUrl = rtspUrl;
		if ( username && password ) {
			const url = new URL( rtspUrl );
			url.username = username;
			url.password = password;
			inputUrl = url.toString();
		}

		console.log( `🔧 FFmpeg input URL: ${inputUrl.replace( /:[^@]*@/, ':***@' )}` ); // Hide password in logs
		console.log( `🔧 FFmpeg output: MJPEG frames to stdout` );

		const args = [
			'-rtsp_transport', 'tcp', // Force TCP for better reliability
			'-i', inputUrl,
			'-c:v', 'mjpeg',
			'-q:v', '3', // MJPEG quality (2-31, lower is better)
			'-s', quality.resolution,
			'-r', quality.fps.toString(),
			'-f', 'image2pipe',
			'-vcodec', 'mjpeg',
			'pipe:1', // Output to stdout
		];

		console.log( `🔧 FFmpeg command: ffmpeg ${args.join( ' ' )}` );
		return args;
	}

	public updateStreamAccess( streamId: string ): boolean {
		const stream = this.streams.get( streamId );
		if ( stream ) {
			stream.lastAccess = Date.now();
			return true;
		}
		return false;
	}

	private broadcastFrame( streamId: string, frame: Buffer ): void {
		const stream = this.streams.get( streamId );
		if ( !stream || stream.clients.size === 0 ) {
			return;
		}

		// Create MJPEG multipart boundary frame
		const boundary = '--ffserver\r\n';
		const headers = `Content-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`;
		const frameData = Buffer.concat( [
			Buffer.from( boundary ),
			Buffer.from( headers ),
			frame,
			Buffer.from( '\r\n' ),
		] );

		// Send to all connected clients
		const disconnectedClients: Response[] = [];
		
		for ( const client of stream.clients ) {
			try {
				if ( !client.destroyed ) {
					client.write( frameData );
				} else {
					disconnectedClients.push( client );
				}
			} catch ( error ) {
				console.log( `📺 Error sending frame to client: ${error}` );
				disconnectedClients.push( client );
			}
		}

		// Remove disconnected clients
		disconnectedClients.forEach( client => stream.clients.delete( client ) );
	}

	public stopStream( streamId: string ): boolean {
		const stream = this.streams.get( streamId );
		if ( stream ) {
			console.log( `⏹️ Stopping stream: ${streamId}` );
			
			// Close all client connections
			for ( const client of stream.clients ) {
				try {
					client.end();
				} catch ( error ) {
					// Ignore errors when closing client connections
				}
			}
			stream.clients.clear();
			
			// Try graceful shutdown first, then force kill on Windows
			if ( process.platform === 'win32' ) {
				try {
					// On Windows, use taskkill for reliable process termination
					spawn( 'taskkill', [ '/pid', stream.process.pid!.toString(), '/T', '/F', ] );
				} catch ( error ) {
					console.warn( `Failed to use taskkill, trying SIGTERM:`, error );
					stream.process.kill( 'SIGTERM' );
				}
			} else {
				stream.process.kill( 'SIGTERM' );
			}
			
			this.streams.delete( streamId );
			this.cleanupStreamFiles( streamId );
			return true;
		}
		return false;
	}

	private cleanupInactiveStreams(): void {
		const now = Date.now();
		const timeout = 5 * 60 * 1000; // 5 minutes

		for ( const [ streamId, stream, ] of this.streams ) {
			if ( now - stream.lastAccess > timeout ) {
				console.log( `🧹 Cleaning up inactive stream: ${streamId}` );
				this.stopStream( streamId );
			}
		}
	}

	// TODO remove unused stuff
	private cleanupStreamFiles( streamId: string ): void {
		try {
			// For MJPEG streaming, we don't need to clean up files since we're streaming directly
			// Just log the cleanup for now
			console.log( `🗑️ Cleaned up stream resources for: ${streamId}` );
		} catch ( error ) {
			console.error( `Error cleaning up stream files for ${streamId}:`, error );
		}
	}

	public cleanup(): void {
		console.log( '🧹 Cleaning up all streams...' );
		
		clearInterval( this.cleanupInterval );
		
		for ( const [ streamId, stream, ] of this.streams ) {
			// Use platform-specific termination
			if ( process.platform === 'win32' ) {
				try {
					spawn( 'taskkill', [ '/pid', stream.process.pid!.toString(), '/T', '/F', ] );
				} catch ( error ) {
					console.warn( `Failed to use taskkill for ${streamId}:`, error );
					stream.process.kill( 'SIGTERM' );
				}
			} else {
				stream.process.kill( 'SIGTERM' );
			}
			this.cleanupStreamFiles( streamId );
		}
		
		this.streams.clear();
	}

	public getActiveStreams(): string[] {
		return Array.from( this.streams.keys() );
	}

	public getStream( streamId: string ) {
		return this.streams.get( streamId );
	}

	public generateStreamIdFromConfig( rtspUrl: string, quality: string ): string {
		return this.generateStreamId( rtspUrl, quality );
	}
}

// Initialize stream manager
const streamManager = new StreamManager();

app.use( express.json() );
app.use( express.static( '.' ) );

// Add CORS middleware for all API requests
app.use( ( req, res, next ) => {
	res.setHeader( 'Access-Control-Allow-Origin', '*' );
	res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, OPTIONS' );
	res.setHeader( 'Access-Control-Allow-Headers', 'Content-Type, Authorization' );
	
	if ( req.method === 'OPTIONS' ) {
		res.status( 200 ).end();
		return;
	}
	
	next();
} );

// Serve HLS streams with proper headers
app.use( '/hls', ( req, res, next ) => {
	res.setHeader( 'Access-Control-Allow-Origin', '*' );
	res.setHeader( 'Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS' );
	res.setHeader( 'Access-Control-Allow-Headers', 'Content-Type' );
	res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
	res.setHeader( 'Pragma', 'no-cache' );
	res.setHeader( 'Expires', '0' );
	
	if ( req.method === 'OPTIONS' ) {
		res.status( 200 ).end();
		return;
	}
	
	next();
}, express.static( join( __dirname, '../public/hls' ) ) );

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

// RTSP Streaming Endpoints

// Start a new stream
app.post( '/api/stream/start', ( req: Request, res: Response ) => {
	try {
		console.log( '📡 Received stream start request:', req.body );
		const { rtspUrl, username, password, quality = 'medium', } = req.body;

		if ( !rtspUrl ) {
			console.log( '❌ No RTSP URL provided' );
			return res.status( 400 ).json( { error: 'RTSP URL is required', } );
		}

		console.log( `📡 Starting stream for URL: ${rtspUrl}, quality: ${quality}` );

		// Get quality preset or use custom quality
		const qualityConfig = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;

		// Generate stream ID
		const streamId = streamManager.generateStreamIdFromConfig( rtspUrl, quality );
		console.log( `📡 Generated stream ID: ${streamId}` );

		// Configure stream
		const streamConfig: StreamConfig = {
			rtspUrl,
			username,
			password,
			quality: qualityConfig,
		};

		// Start the stream
		const success = streamManager.startStream( streamId, streamConfig );

		if ( success ) {
			const result = {
				streamId,
				streamUrl: `/api/stream/${streamId}/mjpeg`,
				quality: qualityConfig,
			};
			console.log( `✅ Stream started successfully:`, result );
			res.json( result );
		} else {
			console.log( '❌ Failed to start stream' );
			res.status( 500 ).json( { error: 'Failed to start stream', } );
		}
	} catch ( error ) {
		console.error( 'Error starting stream:', error );
		res.status( 500 ).json( { error: 'Internal server error', } );
	}
} );

// Update stream access time (keep alive)
app.post( '/api/stream/:streamId/keepalive', ( req: Request, res: Response ) => {
	const { streamId, } = req.params;
	
	const updated = streamManager.updateStreamAccess( streamId );
	
	if ( updated ) {
		res.json( { status: 'updated', } );
	} else {
		res.status( 404 ).json( { error: 'Stream not found', } );
	}
} );

// Stop a stream
app.delete( '/api/stream/:streamId', ( req: Request, res: Response ) => {
	const { streamId, } = req.params;
	
	const stopped = streamManager.stopStream( streamId );
	
	if ( stopped ) {
		res.json( { status: 'stopped', } );
	} else {
		res.status( 404 ).json( { error: 'Stream not found', } );
	}
} );

// List active streams
app.get( '/api/streams', ( _req: Request, res: Response ) => {
	const activeStreams = streamManager.getActiveStreams();
	res.json( { streams: activeStreams, } );
} );

// Get available quality presets
app.get( '/api/quality-presets', ( _req: Request, res: Response ) => {
	res.json( QUALITY_PRESETS );
} );

// Debug endpoint to test RTSP connection
app.post( '/api/debug/rtsp', ( req: Request, res: Response ) => {
	const { rtspUrl, username, password, } = req.body;
	
	if ( !rtspUrl ) {
		return res.status( 400 ).json( { error: 'RTSP URL is required', } );
	}

	console.log( `🔍 Testing RTSP connection: ${rtspUrl}` );
	
	// Build RTSP URL with authentication
	let testUrl = rtspUrl;
	if ( username && password ) {
		try {
			const url = new URL( rtspUrl );
			url.username = username;
			url.password = password;
			testUrl = url.toString();
		} catch ( error ) {
			return res.status( 400 ).json( { error: 'Invalid RTSP URL format', } );
		}
	}

	// Test with minimal FFmpeg probe
	const ffmpegTest = spawn( 'ffmpeg', [
		'-rtsp_transport', 'tcp',
		'-i', testUrl,
		'-t', '1', // Only test for 1 second
		'-f', 'null',
		'-',
	], { stdio: 'pipe', } );

	let stderr = '';
	let success = false;

	ffmpegTest.stderr?.on( 'data', ( data: Buffer ) => {
		stderr += data.toString();
	} );

	ffmpegTest.on( 'close', ( code: number | null ) => {
		// FFmpeg returns various codes, but stderr content tells us more
		const isAuthError = stderr.includes( '401 Unauthorized' ) || stderr.includes( 'authorization failed' );
		const isConnectionError = stderr.includes( 'Connection refused' ) || stderr.includes( 'Connection timed out' );
		const isFormatError = stderr.includes( 'Invalid data found' );
		const hasStreamInfo = stderr.includes( 'Stream #0' ) || stderr.includes( 'Video:' );
		
		let status = 'unknown';
		let message = '';
		
		if ( isAuthError ) {
			status = 'auth_failed';
			message = 'Authentication failed - check username/password';
		} else if ( isConnectionError ) {
			status = 'connection_failed';  
			message = 'Connection failed - check IP address and port';
		} else if ( hasStreamInfo ) {
			status = 'success';
			message = 'RTSP stream accessible';
			success = true;
		} else if ( isFormatError ) {
			status = 'format_error';
			message = 'Invalid stream format or codec issue';
		} else {
			status = 'unknown_error';
			message = `FFmpeg exited with code ${code}`;
		}

		res.json( {
			success,
			status,
			message,
			ffmpegOutput: stderr.split( '\n' ).slice( -10 ).join( '\n' ), // Last 10 lines
		} );
	} );

	ffmpegTest.on( 'error', ( error: Error ) => {
		res.json( {
			success: false,
			status: 'spawn_error',
			message: error.message,
			ffmpegOutput: '',
		} );
	} );

	// Timeout after 10 seconds
	setTimeout( () => {
		if ( !ffmpegTest.killed ) {
			ffmpegTest.kill( 'SIGTERM' );
			res.json( {
				success: false,
				status: 'timeout',
				message: 'Connection test timed out',
				ffmpegOutput: stderr,
			} );
		}
	}, 10000 );
} );

// MJPEG streaming endpoint
app.get( '/api/stream/:streamId/mjpeg', ( req: Request, res: Response ) => {
	const { streamId, } = req.params;
	
	const stream = streamManager.getStream( streamId );
	if ( !stream ) {
		return res.status( 404 ).json( { error: 'Stream not found', } );
	}

	console.log( `📺 New MJPEG client connected for stream: ${streamId}` );

	// Set MJPEG response headers
	res.setHeader( 'Content-Type', 'multipart/x-mixed-replace; boundary=ffserver' );
	res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
	res.setHeader( 'Pragma', 'no-cache' );
	res.setHeader( 'Expires', '0' );
	res.setHeader( 'Access-Control-Allow-Origin', '*' );
	res.setHeader( 'Connection', 'close' );

	// Add client to the stream's client list
	stream.clients.add( res );

	// Handle client disconnect
	req.on( 'close', () => {
		console.log( `📺 MJPEG client disconnected from stream: ${streamId}` );
		stream.clients.delete( res );
	} );

	req.on( 'error', () => {
		stream.clients.delete( res );
	} );

	// Update access time
	streamManager.updateStreamAccess( streamId );
	
	// Send initial boundary
	res.write( '--ffserver\r\n' );
} );

// Serve main HTML file for all non-API, non-HLS routes
app.get( '*', ( req: Request, res: Response ) => {
	// Don't serve index.html for HLS requests
	if ( req.path.startsWith( '/hls/' ) ) {
		res.status( 404 ).json( { error: 'HLS file not found', } );
		return;
	}
	res.sendFile( join( __dirname, '../index.html' ) );
} );

app.listen( port, () => {
	console.log( `TileDash backend server running at http://localhost:${port}` );
} );

export default app;
