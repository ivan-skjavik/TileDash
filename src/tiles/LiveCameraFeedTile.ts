import { BaseTile } from './BaseTile';
import { LiveCameraFeedTileConfig, CameraStream } from '../types';
import { HomeyDevice } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import { TileHMRHelper } from '../utils/TileHMR';

export class LiveCameraFeedTile extends BaseTile {
	private currentCameraIndex: number = -1; // -1 means no camera selected
	private videoElement: HTMLVideoElement | null = null;
	private videoContainer: HTMLElement | null = null;
	private buttonContainer: HTMLElement | null = null;
	private errorContainer: HTMLElement | null = null;
	private isStreaming: boolean = false;
	private currentStreamId: string | null = null;
	private keepAliveInterval: number | null = null;

	constructor(
		tileId: string,
		devices: HomeyDevice[],
		config: LiveCameraFeedTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, devices, config, element, homeyApi );
	}

	protected get cameraConfig(): LiveCameraFeedTileConfig {
		return this.config as LiveCameraFeedTileConfig;
	}

	render(): void {
		this.element.innerHTML = '';
		this.element.classList.add( 'live-camera-feed-tile' );

		// Validate configuration
		if ( !this.cameraConfig.cameras || this.cameraConfig.cameras.length === 0 ) {
			this.renderError( 'No cameras configured' );
			return;
		}

		// Create tile structure
		const container = document.createElement( 'div' );
		container.classList.add( 'tile-container' );

		// Create header with title and camera buttons
		const header = document.createElement( 'div' );
		header.className = 'tile-header camera-tile-header';

		// Title
		const titleElement = document.createElement( 'div' );
		titleElement.classList.add( 'tile-title' );
		titleElement.textContent = this.cameraConfig.name || 'Live Camera Feed';

		// Camera selection buttons
		this.buttonContainer = document.createElement( 'div' );
		this.buttonContainer.classList.add( 'camera-button-group' );
		this.createCameraButtons();

		header.appendChild( titleElement );
		if ( this.cameraConfig.showCameraButtons !== false ) {
			header.appendChild( this.buttonContainer );
		}

		// Video container
		this.videoContainer = document.createElement( 'div' );
		this.videoContainer.classList.add( 'camera-video-container' );

		// Error container (hidden by default)
		this.errorContainer = document.createElement( 'div' );
		this.errorContainer.classList.add( 'camera-error-container', 'hidden' );

		// Create video element
		this.videoElement = document.createElement( 'video' );
		this.videoElement.classList.add( 'camera-video' );
		this.videoElement.autoplay = true;
		this.videoElement.muted = true; // Required for autoplay in most browsers
		this.videoElement.playsInline = true; // Better mobile support
		
		// Apply object-fit style
		const objectFit = this.cameraConfig.objectFit || 'cover';
		this.videoElement.style.objectFit = objectFit;

		// Add video event listeners
		this.setupVideoEventListeners();

		this.videoContainer.appendChild( this.videoElement );
		this.videoContainer.appendChild( this.errorContainer );

		container.appendChild( header );
		container.appendChild( this.videoContainer );
		this.element.appendChild( container );

		// Auto-start first camera if enabled
		if ( this.cameraConfig.autoStart !== false && this.cameraConfig.cameras.length > 0 ) {
			this.selectCamera( 0 );
		}
	}

	private renderError( message: string ): void {
		this.element.classList.add( 'tile--has-error' );
		const errorElement = document.createElement( 'div' );
		errorElement.classList.add( 'tile-error' );
		errorElement.textContent = message;
		this.element.appendChild( errorElement );
	}

	private createCameraButtons(): void {
		if ( !this.buttonContainer ) return;

		this.buttonContainer.innerHTML = '';

		// Create "None" button if enabled
		if ( this.cameraConfig.showNoneButton !== false ) {
			const noneButton = this.createButton( 'None', -1 );
			noneButton.classList.add( 'none-button' );
			this.buttonContainer.appendChild( noneButton );
		}

		// Create camera buttons
		this.cameraConfig.cameras.forEach( ( camera, index ) => {
			const button = this.createButton( camera.title, index );
			this.buttonContainer!.appendChild( button );
		} );

		// Set initial active state
		this.updateButtonStates();
	}

	private createButton( title: string, index: number ): HTMLButtonElement {
		const button = document.createElement( 'button' );
		button.classList.add( 'camera-button' );
		button.textContent = title;
		button.addEventListener( 'click', () => {
			this.selectCamera( index );
		} );
		return button;
	}

	private updateButtonStates(): void {
		if ( !this.buttonContainer ) return;

		const buttons = this.buttonContainer.querySelectorAll( '.camera-button' );
		buttons.forEach( ( button, buttonIndex ) => {
			const isNoneButton = button.classList.contains( 'none-button' );
			const cameraIndex = isNoneButton ? -1 : ( this.cameraConfig.showNoneButton !== false ? buttonIndex - 1 : buttonIndex );
			
			if ( cameraIndex === this.currentCameraIndex ) {
				button.classList.add( 'active' );
			} else {
				button.classList.remove( 'active' );
			}
		} );
	}

	private setupVideoEventListeners(): void {
		if ( !this.videoElement ) return;

		this.videoElement.addEventListener( 'loadstart', () => {
			console.log( `📹 Video loading started for camera ${this.currentCameraIndex}` );
			this.hideError();
			this.element.classList.add( 'tile--loading' );
		} );

		this.videoElement.addEventListener( 'loadeddata', () => {
			console.log( `📹 Video data loaded for camera ${this.currentCameraIndex}` );
			this.element.classList.remove( 'tile--loading' );
			this.isStreaming = true;
		} );

		this.videoElement.addEventListener( 'error', ( event ) => {
			console.error( `❌ Video error for camera ${this.currentCameraIndex}:`, event );
			this.element.classList.remove( 'tile--loading' );
			this.isStreaming = false;
			this.showError( 'Failed to load camera stream' );
		} );

		this.videoElement.addEventListener( 'ended', () => {
			console.log( `📹 Video ended for camera ${this.currentCameraIndex}` );
			this.isStreaming = false;
		} );

		this.videoElement.addEventListener( 'pause', () => {
			console.log( `⏸️ Video paused for camera ${this.currentCameraIndex}` );
			this.isStreaming = false;
		} );

		this.videoElement.addEventListener( 'play', () => {
			console.log( `▶️ Video playing for camera ${this.currentCameraIndex}` );
			this.isStreaming = true;
		} );
	}

	private selectCamera( index: number ): void {
		if ( index === this.currentCameraIndex ) return;

		this.currentCameraIndex = index;
		this.updateButtonStates();

		if ( index === -1 ) {
			// Stop streaming
			this.stopStream();
			this.hideError();
		} else if ( index >= 0 && index < this.cameraConfig.cameras.length ) {
			// Start streaming selected camera
			const camera = this.cameraConfig.cameras[index];
			this.startStream( camera );
		}
	}

	private startStream( camera: CameraStream ): void {
		if ( !this.videoElement ) return;

		console.log( `📹 Starting stream for camera: ${camera.title}` );
		
		this.stopStream(); // Stop any existing stream
		this.hideError();

		try {
			// For RTSP streams, use our server-side FFmpeg conversion
			if ( camera.rtspUrl.startsWith( 'rtsp://' ) ) {
				this.startRTSPStream( camera );
			} else {
				// For HTTP/HLS streams, play directly
				this.videoElement.src = camera.rtspUrl;
				this.videoElement.load();
			}
			
		} catch ( error ) {
			console.error( `❌ Failed to start stream for camera ${camera.title}:`, error );
			this.showError( `Failed to connect to ${camera.title}` );
		}
	}

	private async startRTSPStream( camera: CameraStream ): Promise<void> {
		try {
			// Get quality setting from config or use default
			const quality = this.cameraConfig.quality || 'medium';
			
			// Show loading state
			this.element.classList.add( 'tile--loading' );
			
			// Determine the correct server URL for API calls
			const serverUrl = window.location.port === '3000' ? 'http://localhost:3012' : '';
			const apiUrl = `${serverUrl}/api/stream/start`;
			
			console.log( `📹 Starting RTSP stream for: ${camera.title}` );
			console.log( `📡 Making request to: ${apiUrl}` );
			
			// Request stream start from server
			const response = await fetch( apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify( {
					rtspUrl: camera.rtspUrl,
					username: camera.username,
					password: camera.password,
					quality,
				} ),
			} );

			console.log( '📡 Server response status:', response.status );
			console.log( '📡 Server response headers:', Object.fromEntries( response.headers.entries() ) );
            

			if ( !response.ok ) {
				const responseText = await response.text();
				console.error( '❌ Server error response:', responseText );
				
				// Try to parse as JSON, fall back to plain text
				let errorMessage = 'Unknown error';
				try {
					const errorData = JSON.parse( responseText );
					errorMessage = errorData.error || responseText;
				} catch {
					errorMessage = responseText || `HTTP ${response.status}`;
				}
				
				throw new Error( `Server error: ${response.status} - ${errorMessage}` );
			}

			const result = await response.json();
			this.currentStreamId = result.streamId;
			
			console.log( '📹 Stream start result:', result );
			
			// Build full MJPEG URL
			const fullStreamUrl = `${serverUrl}${result.streamUrl}`;
			console.log( `📹 Full Stream URL: ${fullStreamUrl}` );

			console.log( `📹 Started FFmpeg conversion for: ${result.streamId}` );

			// Start keep-alive immediately to prevent cleanup
			this.startKeepAlive();

			// Wait for FFmpeg to start and generate initial segments
			// Check if playlist file exists before trying to play
			const maxWaitTime = 15000; // 15 seconds max wait
			const checkInterval = 1000; // Check every second
			let waitTime = 0;
			
			const waitForStream = async (): Promise<boolean> => {
				try {
					const streamUrl = `${serverUrl}${result.streamUrl}`;
					console.log( `🔍 Checking stream availability: ${streamUrl}` );
					const streamResponse = await fetch( streamUrl, { method: 'HEAD', } );
					console.log( `🔍 Stream response status: ${streamResponse.status}` );
					if ( streamResponse.ok ) {
						console.log( `🔍 Stream is available` );
					}
					return streamResponse.ok;
				} catch ( error ) {
					console.log( `🔍 Stream check error:`, error );
					return false;
				}
			};

			// Wait for stream to be available
			while ( waitTime < maxWaitTime ) {
				if ( await waitForStream() ) {
					break;
				}
				await new Promise( resolve => setTimeout( resolve, checkInterval ) );
				waitTime += checkInterval;
			}

			if ( waitTime >= maxWaitTime ) {
				throw new Error( 'Stream conversion timed out - FFmpeg may have failed to start' );
			}

			// Start MJPEG playback
			if ( this.videoElement ) {
				const finalStreamUrl = `${serverUrl}${result.streamUrl}`;
				console.log( `📹 Setting video source to: ${finalStreamUrl}` );
				this.videoElement.src = finalStreamUrl;
				this.videoElement.load();
				this.isStreaming = true;
				this.element.classList.remove( 'tile--loading' );
			}

			console.log( `📹 MJPEG stream ready: ${result.streamId}` );

		} catch ( error ) {
			console.error( `❌ Failed to start RTSP stream for camera ${camera.title}:`, error );
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			this.showError( `Failed to start stream: ${errorMessage}` );
			this.element.classList.remove( 'tile--loading' );
			
			// Clean up failed stream
			if ( this.currentStreamId ) {
				const serverUrl = window.location.port === '3000' ? 'http://localhost:3012' : '';
				fetch( `${serverUrl}/api/stream/${this.currentStreamId}`, { method: 'DELETE', } )
					.catch( cleanupError => console.warn( 'Failed to cleanup failed stream:', cleanupError ) );
				this.currentStreamId = null;
			}
		}
	}

	private startKeepAlive(): void {
		if ( this.keepAliveInterval ) {
			clearInterval( this.keepAliveInterval );
		}

		// Send keep-alive every 30 seconds
		this.keepAliveInterval = window.setInterval( async () => {
			if ( this.currentStreamId ) {
				try {
					const serverUrl = window.location.port === '3000' ? 'http://localhost:3012' : '';
					await fetch( `${serverUrl}/api/stream/${this.currentStreamId}/keepalive`, {
						method: 'POST',
					} );
				} catch ( error ) {
					console.warn( `Keep-alive failed for stream ${this.currentStreamId}:`, error );
				}
			}
		}, 30000 );
	}

	private stopStream(): void {
		if ( !this.videoElement ) return;

		console.log( `⏹️ Stopping camera stream` );
		
		// Stop keep-alive interval
		if ( this.keepAliveInterval ) {
			clearInterval( this.keepAliveInterval );
			this.keepAliveInterval = null;
		}

		// Stop server stream if it exists
		if ( this.currentStreamId ) {
			const serverUrl = window.location.port === '3000' ? 'http://localhost:3012' : '';
			fetch( `${serverUrl}/api/stream/${this.currentStreamId}`, { method: 'DELETE', } )
				.catch( error => console.warn( `Failed to stop server stream ${this.currentStreamId}:`, error ) );
			this.currentStreamId = null;
		}
		
		this.videoElement.pause();
		this.videoElement.src = '';
		this.videoElement.load();
		this.isStreaming = false;
		this.element.classList.remove( 'tile--loading' );
	}

	private showError( message: string ): void {
		if ( !this.errorContainer ) return;
		
		this.errorContainer.textContent = message;
		this.errorContainer.classList.remove( 'hidden' );
		this.element.classList.add( 'tile--has-error' );
	}

	private hideError(): void {
		if ( !this.errorContainer ) return;
		
		this.errorContainer.classList.add( 'hidden' );
		this.element.classList.remove( 'tile--has-error' );
	}

	update(): void {
		// Live camera feed tiles don't have device updates
		// All state is managed internally
	}

	/**
	 * Public method to switch to specific camera
	 */
	public switchToCamera( index: number ): void {
		this.selectCamera( index );
	}

	/**
	 * Public method to switch to next camera
	 */
	public nextCamera(): void {
		if ( this.cameraConfig.cameras.length === 0 ) return;
		
		let nextIndex = this.currentCameraIndex + 1;
		if ( nextIndex >= this.cameraConfig.cameras.length ) {
			nextIndex = this.cameraConfig.showNoneButton !== false ? -1 : 0;
		}
		this.selectCamera( nextIndex );
	}

	/**
	 * Public method to switch to previous camera
	 */
	public previousCamera(): void {
		if ( this.cameraConfig.cameras.length === 0 ) return;
		
		let prevIndex = this.currentCameraIndex - 1;
		if ( prevIndex < ( this.cameraConfig.showNoneButton !== false ? -1 : 0 ) ) {
			prevIndex = this.cameraConfig.cameras.length - 1;
		}
		this.selectCamera( prevIndex );
	}

	/**
	 * Public method to stop all streaming
	 */
	public stopStreaming(): void {
		this.selectCamera( -1 );
	}

	/**
	 * Public method to check if currently streaming
	 */
	public getStreamingStatus(): { isStreaming: boolean; currentCamera?: CameraStream; currentIndex: number } {
		return {
			isStreaming: this.isStreaming,
			currentCamera: this.currentCameraIndex >= 0 ? this.cameraConfig.cameras[this.currentCameraIndex] : undefined,
			currentIndex: this.currentCameraIndex,
		};
	}

	public cleanup(): void {
		super.cleanup();
		this.stopStream();
	}
}

// Hot Module Replacement (HMR) support
if ( import.meta.hot ) {
	import.meta.hot.accept( TileHMRHelper.create( LiveCameraFeedTile, 'LiveCameraFeedTile' ) );
}
