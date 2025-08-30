import { TileFactory } from '@/services/TileFactory';

/**
 * Example configuration for Image Carousel Tiles
 * 
 * This file demonstrates various ways to configure the new IMAGE_CAROUSEL tile type.
 * Copy and modify these examples for your own dashboard configuration.
 */

// Example 1: Basic image carousel with local images
export const basicImageCarousel = TileFactory.createConfig( 'IMAGE_CAROUSEL', {
	position: [ 0, 0, ],
	width: 3,
	height: 2,
	name: "Nature Gallery",
	images: [
		"./img/Landscape/1.jpg",
		"./img/Landscape/2.jpg",
		"./img/Landscape/3.jpg",
		"./img/Landscape/4.jpg",
		"./img/Landscape/5.jpg",
	],
	interval: 5,
	autoAdvance: true,
	showDots: true,
	showCounter: false,
} );

// Example 2: Fast slideshow with counter
export const fastSlideshow = TileFactory.createConfig( 'IMAGE_CAROUSEL', {
	position: [ 3, 0, ],
	width: 2,
	height: 2,
	name: "Quick Pics",
	images: [
		"./img/Portrait/1.jpg",
		"./img/Portrait/2.jpg",
		"./img/Portrait/3.jpg",
	],
	interval: 2,
	autoAdvance: true,
	objectFit: 'contain',
	showDots: false,
	showCounter: true,
} );

// Example 3: Manual navigation only
export const manualCarousel = TileFactory.createConfig( 'IMAGE_CAROUSEL', {
	position: [ 5, 0, ],
	width: 4,
	height: 3,
	name: "Art Collection",
	images: [
		"./img/hexagone.jpg",
		"./img/flow.png",
		"./img/favicon.png",
	],
	autoAdvance: false,  // Disable auto-advance
	objectFit: 'contain',
	showDots: true,
	showCounter: true,
} );

// Example 4: Large showcase tile
export const showcaseTile = TileFactory.createConfig( 'IMAGE_CAROUSEL', {
	position: [ 0, 3, ],
	width: 6,
	height: 4,
	name: "Photo Showcase",
	images: [
		"./img/Landscape/1.jpg",
		"./img/Landscape/2.jpg",
		"./img/Landscape/3.jpg",
		"./img/Landscape/4.jpg",
		"./img/Landscape/5.jpg",
	],
	interval: 8,
	autoAdvance: true,
	objectFit: 'cover',
	showDots: true,
	showCounter: true,
} );

// Example 5: Compact tile without title
export const compactCarousel = TileFactory.createConfig( 'IMAGE_CAROUSEL', {
	position: [ 6, 3, ],
	width: 2,
	height: 2,
	// No name - title header will be hidden
	images: [
		"./img/Portrait/1.jpg",
		"./img/Portrait/2.jpg",
	],
	interval: 3,
	autoAdvance: true,
	objectFit: 'cover',
	showDots: true,
	showCounter: false,
} );

/**
 * Usage in your main config.ts:
 * 
 * import { basicImageCarousel, fastSlideshow } from './examples/image-carousel-examples';
 * 
 * export const appConfig: AppConfig = {
 *   dashboards: [{
 *     pages: [{
 *       tiles: [
 *         basicImageCarousel,
 *         fastSlideshow,
 *         // ... other tiles
 *       ]
 *     }]
 *   }]
 * };
 */
