import { BaseTile } from './BaseTile';
import { ImageCarouselTileConfig } from '../types';
import { HomeyDevice } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import { TileHMRHelper } from '../utils/TileHMR';

export class ImageCarouselTile extends BaseTile {
	private currentImageIndex: number = 0;
	private intervalTimer: number | null = null;
	private imageContainer: HTMLElement | null = null;
	private dotsContainer: HTMLElement | null = null;
	private counterElement: HTMLElement | null = null;
	private images: HTMLImageElement[] = [];

	constructor(
		tileId: string,
		devices: HomeyDevice[],
		config: ImageCarouselTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, devices, config, element, homeyApi );
	}

	protected get carouselConfig(): ImageCarouselTileConfig {
		return this.config as ImageCarouselTileConfig;
	}

	render(): void {
		this.element.innerHTML = '';
		this.element.classList.add( 'image-carousel-tile' );

		// Validate configuration
		if ( !this.carouselConfig.images || this.carouselConfig.images.length === 0 ) {
			this.renderError( 'No images configured' );
			return;
		}

		// Create tile structure
		const container = document.createElement( 'div' );
		container.classList.add( 'tile-container' );

		// Title (optional)
		if ( this.carouselConfig.name ) {
			const header = document.createElement( 'div' );
			header.className = 'tile-header';

			const titleElement = document.createElement( 'div' );
			titleElement.classList.add( 'tile-title' );
			titleElement.textContent = this.carouselConfig.name;
			header.appendChild( titleElement );

			container.appendChild( header );
		}

		// Image container
		this.imageContainer = document.createElement( 'div' );
		this.imageContainer.classList.add( 'image-carousel-container' );

		// Add click handler for manual navigation
		this.imageContainer.addEventListener( 'click', () => {
			this.nextImage();
		} );

		// Preload all images
		this.preloadImages();

		container.appendChild( this.imageContainer );

		// Add navigation indicators if enabled
		if ( this.carouselConfig.showDots || this.carouselConfig.showCounter ) {
			const indicatorsContainer = document.createElement( 'div' );
			indicatorsContainer.classList.add( 'image-carousel-indicators' );

			// Dots indicator
			if ( this.carouselConfig.showDots ) {
				this.dotsContainer = document.createElement( 'div' );
				this.dotsContainer.classList.add( 'image-carousel-dots' );
				this.createDots();
				indicatorsContainer.appendChild( this.dotsContainer );
			}

			// Counter indicator
			if ( this.carouselConfig.showCounter ) {
				this.counterElement = document.createElement( 'div' );
				this.counterElement.classList.add( 'image-carousel-counter' );
				this.updateCounter();
				indicatorsContainer.appendChild( this.counterElement );
			}

			container.appendChild( indicatorsContainer );
		}

		this.element.appendChild( container );

		// Start auto-advance if enabled
		this.startAutoAdvance();

		// Display first image
		this.displayCurrentImage();
	}

	private renderError( message: string ): void {
		this.element.classList.add( 'tile--has-error' );
		const errorElement = document.createElement( 'div' );
		errorElement.classList.add( 'tile-error' );
		errorElement.textContent = message;
		this.element.appendChild( errorElement );
	}

	private preloadImages(): void {
		this.images = [];
		this.carouselConfig.images.forEach( ( imageSrc, index ) => {
			const img = new Image();
			img.onload = () => {
				console.log( `✅ Image ${index + 1}/${this.carouselConfig.images.length} loaded: ${imageSrc}` );
			};
			img.onerror = () => {
				console.error( `❌ Failed to load image ${index + 1}: ${imageSrc}` );
			};
			img.src = imageSrc;
			img.alt = `Carousel image ${index + 1}`;
			img.classList.add( 'image-carousel-image' );
			
			// Apply object-fit style
			const objectFit = this.carouselConfig.objectFit || 'cover';
			img.style.objectFit = objectFit;
			
			this.images.push( img );
		} );
	}

	private createDots(): void {
		if ( !this.dotsContainer ) return;

		this.dotsContainer.innerHTML = '';
		this.carouselConfig.images.forEach( ( _, index ) => {
			const dot = document.createElement( 'div' );
			dot.classList.add( 'image-carousel-dot' );
			if ( index === this.currentImageIndex ) {
				dot.classList.add( 'active' );
			}
			
			// Add click handler for dot navigation
			dot.addEventListener( 'click', ( e ) => {
				e.stopPropagation(); // Prevent triggering the main tile click
				this.goToImage( index );
			} );
			
			this.dotsContainer!.appendChild( dot );
		} );
	}

	private updateCounter(): void {
		if ( !this.counterElement ) return;
		
		const current = this.currentImageIndex + 1;
		const total = this.carouselConfig.images.length;
		this.counterElement.textContent = `${current}/${total}`;
	}

	private updateDots(): void {
		if ( !this.dotsContainer ) return;

		const dots = this.dotsContainer.querySelectorAll( '.image-carousel-dot' );
		dots.forEach( ( dot, index ) => {
			dot.classList.toggle( 'active', index === this.currentImageIndex );
		} );
	}

	private displayCurrentImage(): void {
		if ( !this.imageContainer || this.images.length === 0 ) return;

		// Clear container
		this.imageContainer.innerHTML = '';

		// Add current image
		const currentImage = this.images[this.currentImageIndex];
		if ( currentImage ) {
			this.imageContainer.appendChild( currentImage.cloneNode( true ) );
		}

		// Update indicators
		this.updateDots();
		this.updateCounter();
	}

	private nextImage(): void {
		this.currentImageIndex = ( this.currentImageIndex + 1 ) % this.carouselConfig.images.length;
		this.displayCurrentImage();
		this.restartAutoAdvance(); // Restart timer when manually advancing
	}

	private goToImage( index: number ): void {
		if ( index >= 0 && index < this.carouselConfig.images.length ) {
			this.currentImageIndex = index;
			this.displayCurrentImage();
			this.restartAutoAdvance(); // Restart timer when manually navigating
		}
	}

	private startAutoAdvance(): void {
		if ( this.carouselConfig.autoAdvance === false || this.carouselConfig.images.length <= 1 ) {
			return;
		}

		const interval = ( this.carouselConfig.interval || 5 ) * 1000; // Convert to milliseconds
		this.intervalTimer = window.setInterval( () => {
			this.nextImage();
		}, interval );

		console.log( `🔄 Auto-advance started with ${interval / 1000}s interval` );
	}

	private stopAutoAdvance(): void {
		if ( this.intervalTimer ) {
			clearInterval( this.intervalTimer );
			this.intervalTimer = null;
		}
	}

	private restartAutoAdvance(): void {
		this.stopAutoAdvance();
		this.startAutoAdvance();
	}

	update(): void {
		// Image carousel tiles don't have device updates
		// All state is managed internally
	}

	/**
	 * Public method to manually advance to next image
	 */
	public next(): void {
		this.nextImage();
	}

	/**
	 * Public method to manually go to previous image
	 */
	public previous(): void {
		this.currentImageIndex = this.currentImageIndex === 0 
			? this.carouselConfig.images.length - 1 
			: this.currentImageIndex - 1;
		this.displayCurrentImage();
		this.restartAutoAdvance();
	}

	/**
	 * Public method to go to specific image
	 */
	public goTo( index: number ): void {
		this.goToImage( index );
	}

	/**
	 * Public method to pause/resume auto-advance
	 */
	public toggleAutoAdvance(): void {
		if ( this.intervalTimer ) {
			this.stopAutoAdvance();
		} else {
			this.startAutoAdvance();
		}
	}

	public cleanup(): void {
		super.cleanup();
		this.stopAutoAdvance();
	}
}

// Hot Module Replacement (HMR) support
if ( import.meta.hot ) {
	import.meta.hot.accept( TileHMRHelper.create( ImageCarouselTile, 'ImageCarouselTile' ) );
}
