import { Tile, DashboardPage, HomeyDevice, /* SliderTileConfig, SwitchTileConfig, SensorTileConfig, ButtonTileConfig, */ AppliancesTileConfig, EnergyPriceTileConfig, /*  AppConfig, */ getTileDeviceIds } from '../types';
import { BaseTile } from '../tiles/BaseTile';
// import { SliderTile } from '../tiles/SliderTile';
// import { SwitchTile } from '../tiles/SwitchTile';
// import { SensorTile } from '../tiles/SensorTile';
// import { ButtonTile } from '../tiles/ButtonTile';
import { HomeyClient } from '../services/HomeyClient';
import { AppliancesTile } from '@/tiles/AppliancesTile';
import { EnergyPriceTile } from '@/tiles/EnergyPriceTile';

export class TileRenderer {
	private container: HTMLElement | null;
	private homeyClient: HomeyClient;
	private tiles: Map<string, BaseTile> = new Map();
	private currentPageIndex: number = 0;
	private pages: DashboardPage[] = [];
	// private _config: AppConfig; // Stored for future use
	private hmr: any = null; // HMR instance reference

	constructor( containerId: string, homeyClient: HomeyClient /* config: AppConfig */ ) {
		console.log( 'TileRenderer: Constructor called with containerId:', containerId );

		this.container = document.getElementById( containerId );
		this.homeyClient = homeyClient;
		// this._config = config;

		if ( !this.container ) {
			console.error( `TileRenderer: Container with id '${containerId}' not found!` );
		} else {
			console.log( 'TileRenderer: Container found successfully', this.container );
		}

		// Add keyboard navigation support
		this.setupKeyboardNavigation();
	}

	/**
   * Set HMR instance for tile registration
   */
	public setHMR( hmr: any ): void {
		this.hmr = hmr;
	}

	/**
   * Set up keyboard navigation (arrow keys for page switching)
   */
	private setupKeyboardNavigation(): void {
		document.addEventListener( 'keydown', ( event ) => {
			// Only handle navigation if we have multiple pages
			if ( this.pages.length <= 1 ) return;

			switch ( event.key ) {
				case 'ArrowLeft':
					event.preventDefault();
					this.previousPage();
					break;
				case 'ArrowRight':
					event.preventDefault();
					this.nextPage();
					break;
			}
		} );
	}

	/**
   * Create a tile instance based on type
   */
	public createTileInstance(
		tileId: string,
		type: string,
		config: Tile,
		element: HTMLElement
	): BaseTile | null {
		try {
			const homeyApi = this.homeyClient.getApi();
			
			// Get required device IDs from config
			const requiredDeviceIds = getTileDeviceIds( config );
			
			// Look up devices in HomeyClient's device register
			const devices: HomeyDevice[] = [];
			requiredDeviceIds.forEach( deviceId => {
				const device = this.homeyClient.devices.get( deviceId );
				if ( device ) {
					devices.push( device );
				} else {
					console.warn( `Device ${deviceId} not found in HomeyClient device register for tile ${tileId}` );
				}
			} );
			
			console.log( `🔧 Creating ${type} tile with ${devices.length} devices:`, requiredDeviceIds );
      
			switch ( type.toUpperCase() ) {
				// case 'SLIDER':
				// 	return new SliderTile( tileId, devices, config as SliderTileConfig, element, homeyApi );
				// case 'SWITCH':
				// 	return new SwitchTile( tileId, devices, config as SwitchTileConfig, element, homeyApi );
				// case 'SENSOR':
				// case 'BINARY_SENSOR':
				// 	return new SensorTile( tileId, devices, config as SensorTileConfig, element, homeyApi );
				// case 'BUTTON':
				// 	return new ButtonTile( tileId, devices, config as ButtonTileConfig, element, homeyApi );
				case 'APPLIANCES':
					return new AppliancesTile( tileId, devices, config as AppliancesTileConfig, element, homeyApi );
				case 'ENERGY_PRICE':
					return new EnergyPriceTile( tileId, devices, config as EnergyPriceTileConfig, element, homeyApi );
				default:
					console.warn( `Unknown tile type: ${type}` );
					return null;
			}
		} catch ( error ) {
			console.warn( `HomeyAPI not available for tile creation: ${type} - ${tileId}`, error );
			return null;
		}
	}

	/**
   * 4. Create and register a tile
   */
	public createTile(
		tileId: string,
		type: string,
		config: Tile,
		position: [number, number],
		width: number,
		height: number,
		parentContainer?: HTMLElement
	): HTMLElement | null {
		const targetContainer = parentContainer || this.container;
    
		if ( !targetContainer ) {
			console.error( 'No container available for tile creation' );
			return null;
		}

		console.log( `🔲 Creating tile: ${tileId} (${type})` );

		// Create tile DOM element
		const tileElement = document.createElement( 'div' );
		tileElement.classList.add( 'tile', `tile-${type.toLowerCase()}` );
		tileElement.id = tileId;
    
		// Set grid position and size
		tileElement.style.gridColumnStart = `${position[0] + 1}`;
		tileElement.style.gridColumnEnd = `${position[0] + 1 + width}`;

		tileElement.style.gridRowStart = `${position[1] + 1}`;
		tileElement.style.gridRowEnd = `${position[1] + 1 + height}`;

		// Create tile instance (devices are looked up from config internally)
		const tileInstance = this.createTileInstance( tileId, type, config, tileElement );
    
		if ( !tileInstance ) {
			console.error( `Failed to create tile instance for type: ${type}` );
			return null;
		}

		// Register tile
		this.tiles.set( tileId, tileInstance );

		// Register with HMR if available
		if ( this.hmr && import.meta.env.DEV ) {
			this.hmr.registerTile( tileId, config, tileElement, tileInstance );
		}

		// Render tile content
		tileInstance.render();

		// Add to container
		targetContainer.appendChild( tileElement );

		console.log( `✅ Created and registered tile: ${tileId} (${type})` );
		return tileElement;
	}

	/**
   * Get a tile by ID
   */
	public getTile( tileId: string ): BaseTile | undefined {
		return this.tiles.get( tileId );
	}

	/**
   * Remove a tile
   */
	public removeTile( tileId: string ): void {
		const tile = this.tiles.get( tileId );
		if ( tile ) {
			// tile.destroy();
			this.tiles.delete( tileId );
			console.log( `🗑️ Removed tile: ${tileId}` );
		}
	}

	/**
   * Clear all tiles
   */
	public clearAllTiles(): void {
		this.tiles.forEach( ( _tile ) => {
			// tile.destroy();
		} );
		this.tiles.clear();
    
		if ( this.container ) {
			this.container.innerHTML = '';
		}
    
		console.log( '🧹 Cleared all tiles' );
	}

	/**
   * Update device state across all relevant tiles
   */
	public updateDeviceState( deviceId: string, capability: string, newValue: any ): void {
		let updatedCount = 0;
    
		this.tiles.forEach( ( tile ) => {
			// Check if this tile uses the device (using new multi-device architecture)
			const deviceIds = tile.getDeviceIds();
			if ( deviceIds.includes( deviceId ) ) {
				tile.update( newValue, capability, deviceId );
				updatedCount++;
			}
		} );
    
		if ( updatedCount > 0 ) {
			console.log( `🔄 Updated ${updatedCount} tiles for device ${deviceId}` );
		}
	}

	/**
   * Get all tiles for a specific device
   */
	public getTilesForDevice( deviceId: string ): BaseTile[] {
		const deviceTiles: BaseTile[] = [];
    
		this.tiles.forEach( ( tile ) => {
			// Check if this tile uses the device (using new multi-device architecture)
			const deviceIds = tile.getDeviceIds();
			if ( deviceIds.includes( deviceId ) ) {
				deviceTiles.push( tile );
			}
		} );
    
		return deviceTiles;
	}

	/**
   * Get tile registry stats
   */
	public getStats(): { totalTiles: number; tilesByType: Record<string, number> } {
		const stats = {
			totalTiles: this.tiles.size,
			tilesByType: {} as Record<string, number>,
		};

		this.tiles.forEach( ( tile ) => {
			const type = tile.constructor.name;
			stats.tilesByType[type] = ( stats.tilesByType[type] || 0 ) + 1;
		} );

		return stats;
	}

	/**
   * 1. Render a complete dashboard with multiple pages
   */
	public renderDashboard(
		pages: DashboardPage[],
		_settings: any
	): void {
		console.log( '🎨 Rendering dashboard with', pages.length, 'pages and', this.homeyClient.devices.size, 'devices' );
    
		if ( !this.container ) {
			console.error( 'Container not available for dashboard rendering' );
			return;
		}

		// Store pages and devices for navigation
		this.pages = pages;
		this.currentPageIndex = 0;
    
		// Clear existing content
		this.clearAllTiles();

		// Set up the main dashboard container
		this.container.innerHTML = '';

		// Create navigation if there are multiple pages with icons
		if ( pages.length > 1 && pages.some( page => page.icon ) ) {
			this.createNavigation( pages );
		}

		// Render all pages (hidden except first one)
		pages.forEach( ( page, pageIndex ) => {
			this.renderPage( page, this.homeyClient.devices, pageIndex );
		} );

		console.log( `🎨 Dashboard rendered with ${this.tiles.size} total tiles` );
	}

	/**
   * 2. Render a page with its groups
   */
	public renderPage(
		page: DashboardPage,
		_devices: Map<string, HomeyDevice>,
		pageIndex: number = 0
	): void {
		if ( !this.container ) {
			console.error( 'Container not available for page rendering' );
			return;
		}

		// Create page container
		const dashboardPage = document.createElement( 'div' );
		dashboardPage.className = 'dashboard-page';
		dashboardPage.id = `page-${pageIndex}`;

		dashboardPage.style.gridTemplateColumns = `repeat(${page.width}, var(--tile-size))`;
		dashboardPage.style.gridTemplateRows = `repeat(${page.height}, var(--tile-size))`;

		dashboardPage.classList.toggle( '--active', pageIndex === this.currentPageIndex );

		// Render tiles in this page
		page.tiles.forEach( ( item, itemIndex ) => {
			const tileId = `page-${pageIndex}-tile-${itemIndex}`;
      
			this.createTile(
				tileId,
				item.type,
				item,
				item.position,
				item.width,
				item.height,
				dashboardPage
			);
		} );

		// Add page to main container
		this.container.appendChild( dashboardPage );

		console.log( `📄 Rendered page ${pageIndex} with ${page.tiles.length} tiles` );
	}

	/**
   * 3. Render a group with its tiles
   */
	// public renderGroup(
	// 	group: DashboardGroup,
	// 	devices: Map<string, HomeyDevice>,
	// 	pageIndex: number,
	// 	groupIndex: number,
	// 	parentContainer: HTMLElement
	// ): void {
	// 	console.log( `📦 Rendering group ${groupIndex} with ${group.tiles.length} tiles` );

	// 	// Create group container
	// 	const dashboardGroup = document.createElement( 'div' );
	// 	dashboardGroup.className = 'dashboard-group';
	// 	dashboardGroup.id = `page-${pageIndex}-group-${groupIndex}`;

	// 	// Add group title if provided
	// 	if ( group.title ) {
	// 		const titleElement = document.createElement( 'div' );
	// 		titleElement.className = 'group-title-container';
	// 		titleElement.innerHTML = `<div class="group-title">${group.title}</div>`;
	// 		dashboardGroup.appendChild( titleElement );
	// 	}

	// 	const itemsContainer = document.createElement( 'div' );
	// 	itemsContainer.className = 'items-container';
	// 	dashboardGroup.appendChild( itemsContainer );

	// 	// Set up group layout based on group dimensions
	// 	itemsContainer.style.gridTemplateColumns = `repeat(${group.width}, ${this.config.settings.tileSize || 80}px)`;
	// 	itemsContainer.style.gridTemplateRows = `${ this.config.settings.tileSize || 80 }px repeat(${group.height}, ${this.config.settings.tileSize || 80}px)`;

	// 	// // Set group to span number of cells by its width/height
	// 	// dashboardGroup.style.gridColumn = `span ${group.width}`;
	// 	// dashboardGroup.style.gridRow = `span ${group.height + 1}`;
        
	// 	// Set cell padding
	// 	itemsContainer.style.columnGap =  `${this.config.settings.tileMargin || 5}px`;
	// 	itemsContainer.style.rowGap =  `${this.config.settings.tileMargin || 5}px`;
	// 	// groupContainer.style.padding = `${this.config.settings.tileMargin || 5}px`;



		

	// 	// Add group to page container
	// 	parentContainer.appendChild( dashboardGroup );

	// 	console.log( `📦 Rendered group ${groupIndex} with ${group.tiles.length} tiles` );
	// }

	/**
   * Create navigation bar for multi-page dashboards
   */
	private createNavigation( pages: DashboardPage[] ): void {
		if ( !this.container ) return;

		// Create navigation container
		const navPage = document.getElementById( 'navPage' );

		if ( !navPage ) {
			console.error( 'Navigation page container not found' );
			return;
		}

		navPage.classList.add( '--active' )
		document.body.classList.add( '--nav-active' )

		// Create page button container
		const pageButtonContainer = document.createElement( 'div' );
		pageButtonContainer.id = 'pageButtonContainer';
		pageButtonContainer.className = 'page-button-container';

		// Create page buttons
		pages.forEach( ( page, pageIndex ) => {
			if ( page.icon ) {
				const pageButton = document.createElement( 'div' );
				pageButton.id = `pageButton-${pageIndex}`;
				pageButton.className = 'page-button';
				pageButton.dataset.targetPage = pageIndex.toString();
        
				// Set active for first page
				if ( pageIndex === 0 ) {
					pageButton.classList.add( '--active' );
				}

				// Add click handler
				pageButton.addEventListener( 'click', () => {
					this.navigateToPage( pageIndex );
				} );

				// Create icon
				const pageIcon = document.createElement( 'div' );
				pageIcon.className = `page-icon mdi ${page.icon}`;

				pageButton.appendChild( pageIcon );
				pageButtonContainer.appendChild( pageButton );
			}
		} );

		navPage.appendChild( pageButtonContainer );
		console.log( '🧭 Navigation created with', pages.length, 'page buttons' );
	}

	/**
   * Navigate to a specific page
   */
	private navigateToPage( targetPageIndex: number ): void {
		console.log( `🧭 Navigating to page ${targetPageIndex}` );

		// TODO call homey refresh api to clear all listeners....

		// Update active button
		const allPageButtons = document.querySelectorAll( '.page-button' );
		allPageButtons.forEach( ( button, index ) => {
			if ( index === targetPageIndex ) {
				button.classList.add( '--active' );
			} else {
				button.classList.remove( '--active' );
			}
		} );

		// Show/hide pages
		const allPages = document.querySelectorAll( '.dashboard-page' );
		allPages.forEach( ( page, index ) => {
			const pageElement = page as HTMLElement;
			pageElement.classList.toggle( '--active', index === targetPageIndex )
		} );

		this.currentPageIndex = targetPageIndex;
		console.log( `✅ Navigated to page ${targetPageIndex}` );
	}

	/**
   * Get current page index
   */
	public getCurrentPageIndex(): number {
		return this.currentPageIndex;
	}

	/**
   * Switch to next page
   */
	public nextPage(): void {
		if ( this.currentPageIndex < this.pages.length - 1 ) {
			this.navigateToPage( this.currentPageIndex + 1 );
		}
	}

	/**
   * Switch to previous page
   */
	public previousPage(): void {
		if ( this.currentPageIndex > 0 ) {
			this.navigateToPage( this.currentPageIndex - 1 );
		}
	}

	/**
   * Update devices in the tile renderer
   */
	public updateDevices( devices: HomeyDevice[] ): void {
		console.log( '🔄 Updating devices in tile renderer:', devices.length, 'devices' );
    
		devices.forEach( device => {
			// Update all tiles that use this device
			const deviceTiles = this.getTilesForDevice( device.id );
			deviceTiles.forEach( _tile => {
				// Trigger a re-render or update for this tile
				console.log( `🔄 Updating tile for device: ${device.name}` );
				// The tile should handle its own updates through device listeners
			} );
		} );
	}
}
