import { BaseTile } from './BaseTile';
import { LiveCameraFeedTileConfig, CameraStream } from '../types';
import { HomeyDevice } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import { TileHMRHelper } from '../utils/TileHMR';

export class LiveCameraFeedTile extends BaseTile {
	private currentCameraIndex: number = -1; // -1 means no camera selected
	private videoElement: HTMLVideoElement | null = null;
	private imageElement: HTMLImageElement | null = null;
	private videoContainer: HTMLElement | null = null;
	private buttonContainer: HTMLElement | null = null;
	private errorContainer: HTMLElement | null = null;
	private isStreaming: boolean = false;
	private currentStreamId: string | null = null;
	private streamStarting: boolean = false; // Prevent concurrent stream starts

	constructor(
		tileId: string,
		devices: HomeyDevice[],
		config: LiveCameraFeedTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, devices, config, element, homeyApi );
	}

	render(): void {
		this.element.innerHTML = '';
		this.element.classList.add( 'live-camera-feed-tile' );

		const cameraConfig = this.config as LiveCameraFeedTileConfig;
		
		// Validate configuration
		if ( !cameraConfig.cameras || cameraConfig.cameras.length === 0 ) {
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
		titleElement.textContent = cameraConfig.name || 'Live Camera Feed';

		// Camera selection buttons
		this.buttonContainer = document.createElement( 'div' );
		this.buttonContainer.classList.add( 'camera-button-group' );
		this.createCameraButtons();

		header.appendChild( titleElement );
		if ( cameraConfig.showCameraButtons !== false ) {
			header.appendChild( this.buttonContainer );
		}

		// Video container
		this.videoContainer = document.createElement( 'div' );
		this.videoContainer.classList.add( 'camera-video-container' );

		// Error container (hidden by default)
		this.errorContainer = document.createElement( 'div' );
		this.errorContainer.classList.add( 'camera-error-container', 'hidden' );

		// Create video element for non-RTSP streams or image element for MJPEG
		this.videoElement = document.createElement( 'video' );
		this.videoElement.classList.add( 'camera-video' );
		this.videoElement.autoplay = true;
		this.videoElement.muted = true; // Required for autoplay in most browsers
		this.videoElement.playsInline = true; // Better mobile support
		
		// Create image element for MJPEG streams
		this.imageElement = document.createElement( 'img' );
		this.imageElement.classList.add( 'camera-video', 'camera-image' );
		
		// Apply object-fit style to both elements
		const objectFit = cameraConfig.objectFit || 'cover';
		this.videoElement.style.objectFit = objectFit;
		this.imageElement.style.objectFit = objectFit;

		// Add video event listeners
		this.setupVideoEventListeners();
		this.setupImageEventListeners();

		// Initially hide both elements
		this.videoElement.style.display = 'none';
		this.imageElement.style.display = 'none';

		this.videoContainer.appendChild( this.videoElement );
		this.videoContainer.appendChild( this.imageElement );
		this.videoContainer.appendChild( this.errorContainer );

		container.appendChild( header );
		container.appendChild( this.videoContainer );
		this.element.appendChild( container );

		// Auto-start first camera if enabled
		if ( cameraConfig.autoStart !== false && cameraConfig.cameras.length > 0 ) {
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

		const cameraConfig = this.config as LiveCameraFeedTileConfig;
		this.buttonContainer.innerHTML = '';

		// Create "None" button if enabled
		if ( cameraConfig.showNoneButton !== false ) {
			const noneButton = this.createButton( 'None', -1 );
			noneButton.classList.add( 'none-button' );
			this.buttonContainer.appendChild( noneButton );
		}

		// Create camera buttons
		cameraConfig.cameras.forEach( ( camera: any, index: number ) => {
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

		const cameraConfig = this.config as LiveCameraFeedTileConfig;
		const buttons = this.buttonContainer.querySelectorAll( '.camera-button' );
		buttons.forEach( ( button, buttonIndex ) => {
			const isNoneButton = button.classList.contains( 'none-button' );
			const cameraIndex = isNoneButton ? -1 : ( cameraConfig.showNoneButton !== false ? buttonIndex - 1 : buttonIndex );
			
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
			this.hideError();
			this.element.classList.add( 'tile--loading' );
		} );

		this.videoElement.addEventListener( 'loadeddata', () => {
			this.element.classList.remove( 'tile--loading' );
			this.isStreaming = true;
		} );

		this.videoElement.addEventListener( 'error', ( event ) => {
			console.error( `Video error for camera ${this.currentCameraIndex}:`, event );
			this.element.classList.remove( 'tile--loading' );
			this.isStreaming = false;
			this.showError( 'Failed to load camera stream' );
		} );

		this.videoElement.addEventListener( 'ended', () => {
			this.isStreaming = false;
		} );

		this.videoElement.addEventListener( 'pause', () => {
			this.isStreaming = false;
		} );

		this.videoElement.addEventListener( 'play', () => {
			this.isStreaming = true;
		} );
	}

	private setupImageEventListeners(): void {
		if ( !this.imageElement ) return;

		this.imageElement.addEventListener( 'load', () => {
			this.element.classList.remove( 'tile--loading' );
			this.isStreaming = true;
			this.hideError();
		} );

		this.imageElement.addEventListener( 'error', ( event ) => {
			console.error( `Image error for MJPEG camera ${this.currentCameraIndex}:`, event );
			this.element.classList.remove( 'tile--loading' );
			this.isStreaming = false;
			this.showError( 'Failed to load MJPEG stream' );
		} );
	}

	private selectCamera( index: number ): void {
		if ( index === this.currentCameraIndex ) return;
		if ( this.streamStarting ) {
			console.log( `📹 Stream start already in progress, ignoring camera ${index}` );
			return;
		}

		// Set transitioning state to prevent concurrent operations
		this.streamStarting = true;
		this.currentCameraIndex = index;
		this.updateButtonStates();

		if ( index === -1 ) {
			// Stop streaming and wait for cleanup
			this.stopStreamWithDelay().finally( () => {
				this.streamStarting = false;
				this.hideError();
			} );
		} else if ( index >= 0 && index < ( this.config as LiveCameraFeedTileConfig ).cameras.length ) {
			// Start streaming selected camera with proper sequencing
			const camera = ( this.config as LiveCameraFeedTileConfig ).cameras[index];
			this.switchStreamSequentially( camera );
		}
	}

	private async switchStreamSequentially( camera: CameraStream ): Promise<void> {
		try {
			// Step 1: Stop current stream and wait for cleanup
			await this.stopStreamWithDelay();
			
			// Step 2: Wait additional time for network cleanup
			await new Promise( resolve => setTimeout( resolve, 500 ) );
			
			// Step 3: Start new stream
			await this.startStream( camera );
		} catch ( error ) {
			console.error( `❌ Failed to switch to camera ${camera.title}:`, error );
			this.showError( `Failed to switch to ${camera.title}` );
		} finally {
			this.streamStarting = false;
		}
	}

	private async stopStreamWithDelay( delay = 300 ): Promise<void> {
		return new Promise( ( resolve ) => {
			console.log( `⏸️ Stopping stream with delay for cleanup...` );
			this.stopStream();
			// Give time for server cleanup and network resources to be released
			// This delay is important for MJPEG connections to fully close
			setTimeout( () => {
				console.log( `⏸️ Stream stop delay complete, ready for new stream` );
				resolve();
			}, delay );
		} );
	}

	private async startStream( camera: CameraStream ): Promise<void> {
		if ( !this.videoElement || !this.imageElement ) return;

		console.log( `📹 Starting stream for camera: ${camera.title}` );
		
		// Ensure clean state before starting
		this.hideError();
		this.element.classList.add( 'tile--loading' );

		try {
			// For RTSP streams, use our server-side FFmpeg conversion (MJPEG output)
			if ( camera.rtspUrl.startsWith( 'rtsp://' ) ) {
				await this.startRTSPStream( camera );
			} else {
				// For HTTP/HLS streams, play directly in video element
				if ( this.videoElement && this.imageElement ) {
					this.videoElement.style.display = 'block';
					this.imageElement.style.display = 'none';
				}
				this.videoElement.src = camera.rtspUrl;
				this.videoElement.load();
				
				// Wait for video to be ready
				await new Promise<void>( ( resolve, reject ) => {
					const timeout = setTimeout( () => reject( new Error( 'Video load timeout' ) ), 10000 );
					
					const onLoad = () => {
						clearTimeout( timeout );
						this.videoElement?.removeEventListener( 'loadeddata', onLoad );
						this.videoElement?.removeEventListener( 'error', onError );
						resolve();
					};
					
					const onError = ( _event: Event ) => {
						clearTimeout( timeout );
						this.videoElement?.removeEventListener( 'loadeddata', onLoad );
						this.videoElement?.removeEventListener( 'error', onError );
						reject( new Error( 'Video failed to load' ) );
					};
					
					this.videoElement?.addEventListener( 'loadeddata', onLoad );
					this.videoElement?.addEventListener( 'error', onError );
				} );
			}
			
		} catch ( error ) {
			console.error( `❌ Failed to start stream for camera ${camera.title}:`, error );
			this.showError( `Failed to connect to ${camera.title}` );
			this.element.classList.remove( 'tile--loading' );
			throw error;
		}
	}

	private async startRTSPStream( camera: CameraStream ): Promise<void> {
		if ( this.streamStarting ) return;
		
		try {
			this.streamStarting = true;
			
			// Get quality setting from config or use default
			const quality = ( this.config as LiveCameraFeedTileConfig ).quality || 'medium';
			
			// Show loading state
			this.element.classList.add( 'tile--loading' );
			this.hideError();
			
			// Determine the correct server URL for API calls
			const serverUrl = window.location.port === '3000' ? 'http://localhost:3012' : '';
			const apiUrl = `${serverUrl}/api/stream/start`;
			
			console.log( `📹 Starting RTSP stream for: ${camera.title}` );
			
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
					// Add a unique client ID to ensure unique streams per client
					clientId: `${this.tileId}-${Date.now()}-${Math.random().toString( 36 ).substr( 2, 9 )}`,
				} ),
			} );

			if ( !response.ok ) {
				const responseText = await response.text();
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
			
			console.log( `📹 Stream created with ID: ${result.streamId}` );
			
			// Build MJPEG URL and start playback immediately
			const mjpegUrl = `${serverUrl}${result.streamUrl}`;
			console.log( `� Connecting to MJPEG stream: ${mjpegUrl}` );

			// Start MJPEG playback using image element
			if ( this.imageElement && this.currentStreamId === result.streamId ) {
				if ( this.videoElement && this.imageElement ) {
					this.videoElement.style.display = 'none';
					this.imageElement.style.display = 'block';
				}
				console.log( `📡 Connecting to stream: ${mjpegUrl}` );
				this.imageElement.src = mjpegUrl;
				// The image load/error events will handle state updates
			}

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
		} finally {
			this.streamStarting = false;
		}
	}

	private stopStream(): void {
		if ( !this.videoElement || !this.imageElement ) return;

		console.log( `⏹️ Stopping camera stream (current: ${this.currentStreamId})` );
		
		// Signal to server that we're disconnecting to help with client tracking
		if ( this.currentStreamId ) {
			const serverUrl = window.location.port === '3000' ? 'http://localhost:3012' : '';
			fetch( `${serverUrl}/api/stream/${this.currentStreamId}/disconnect`, { 
				method: 'POST',
			} ).catch( error => console.warn( `Failed to signal disconnect for stream ${this.currentStreamId}:`, error ) );
		}
		
		// Clear all media sources and reset state
		this.videoElement.pause();
		this.videoElement.src = '';
		this.videoElement.removeAttribute( 'src' );
		this.videoElement.load();
		
		// For image element, use a simple approach to disconnect
		// Setting src to empty string should close the MJPEG connection
		this.imageElement.src = '';
		this.imageElement.removeAttribute( 'src' );
		
		// Hide both elements
		this.videoElement.style.display = 'none';
		this.imageElement.style.display = 'none';
		
		// Reset all state
		this.currentStreamId = null;
		this.isStreaming = false;
		this.streamStarting = false;
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
		const cameraConfig = this.config as LiveCameraFeedTileConfig;
		if ( cameraConfig.cameras.length === 0 ) return;
		
		let nextIndex = this.currentCameraIndex + 1;
		if ( nextIndex >= cameraConfig.cameras.length ) {
			nextIndex = cameraConfig.showNoneButton !== false ? -1 : 0;
		}
		this.selectCamera( nextIndex );
	}

	/**
	 * Public method to switch to previous camera
	 */
	public previousCamera(): void {
		const cameraConfig = this.config as LiveCameraFeedTileConfig;
		if ( cameraConfig.cameras.length === 0 ) return;
		
		let prevIndex = this.currentCameraIndex - 1;
		if ( prevIndex < ( cameraConfig.showNoneButton !== false ? -1 : 0 ) ) {
			prevIndex = cameraConfig.cameras.length - 1;
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
		const cameraConfig = this.config as LiveCameraFeedTileConfig;
		return {
			isStreaming: this.isStreaming,
			currentCamera: this.currentCameraIndex >= 0 ? cameraConfig.cameras[this.currentCameraIndex] : undefined,
			currentIndex: this.currentCameraIndex,
		};
	}

	public cleanup(): void {
		super.cleanup();
		// When cleaning up the tile, we should disconnect from the stream
		// but let the server decide if it should stop based on remaining clients
		this.stopStream();
	}
}

// Hot Module Replacement (HMR) support
if ( import.meta.hot ) {
	import.meta.hot.accept( TileHMRHelper.create( LiveCameraFeedTile, 'LiveCameraFeedTile' ) );
}
