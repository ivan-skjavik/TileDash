import { Tile, Group, DashboardPage, HomeyDevice, SliderTile as SliderTileConfig, SwitchTile as SwitchTileConfig, SensorTile as SensorTileConfig, ButtonTile as ButtonTileConfig } from '../types';
import { BaseTile } from '../tiles/BaseTile';
import { SliderTile } from '../tiles/SliderTile';
import { SwitchTile } from '../tiles/SwitchTile';
import { SensorTile } from '../tiles/SensorTile';
import { ButtonTile } from '../tiles/ButtonTile';
import { HomeyClient } from '../services/HomeyClient';

export class TileRenderer {
  private container: HTMLElement | null;
  private homeyClient: HomeyClient;
  private tiles: Map<string, BaseTile> = new Map();
  private currentPageIndex: number = 0;
  private pages: DashboardPage[] = [];
  private deviceMap: Map<string, HomeyDevice> = new Map();

  constructor(containerId: string, homeyClient: HomeyClient) {
    console.log('TileRenderer: Constructor called with containerId:', containerId);
    this.container = document.getElementById(containerId);
    this.homeyClient = homeyClient;

    if (!this.container) {
      console.error(`TileRenderer: Container with id '${containerId}' not found!`);
    } else {
      console.log('TileRenderer: Container found successfully', this.container);
    }

    // Add keyboard navigation support
    this.setupKeyboardNavigation();
  }

  /**
   * Set up keyboard navigation (arrow keys for page switching)
   */
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      // Only handle navigation if we have multiple pages
      if (this.pages.length <= 1) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.previousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.nextPage();
          break;
      }
    });
  }

  /**
   * Create a tile instance based on type
   */
  private createTileInstance(
    tileId: string,
    type: string,
    device: HomeyDevice | null,
    config: Tile,
    element: HTMLElement
  ): BaseTile | null {
    const homeyApi = this.homeyClient.homeyApi;
    if (!homeyApi) {
      console.warn(`HomeyAPI not available for tile creation: ${type} - ${tileId}`);
      // Return null or create a mock tile for development
      return null;
    }

    switch (type.toUpperCase()) {
      case 'SLIDER':
        return new SliderTile(tileId, device, config as SliderTileConfig, element, homeyApi);
      case 'SWITCH':
        return new SwitchTile(tileId, device, config as SwitchTileConfig, element, homeyApi);
      case 'SENSOR':
      case 'BINARY_SENSOR':
        return new SensorTile(tileId, device, config as SensorTileConfig, element, homeyApi);
      case 'BUTTON':
        return new ButtonTile(tileId, device, config as ButtonTileConfig, element, homeyApi);
      default:
        console.warn(`Unknown tile type: ${type}`);
        return null;
    }
  }

  /**
   * 4. Create and register a tile
   */
  public createTile(
    tileId: string,
    type: string,
    device: HomeyDevice | null,
    config: Tile,
    position: [number, number],
    width: number,
    height: number,
    parentContainer?: HTMLElement
  ): HTMLElement | null {
    const targetContainer = parentContainer || this.container;
    
    if (!targetContainer) {
      console.error('No container available for tile creation');
      return null;
    }

    console.log(`🔲 Creating tile: ${tileId} (${type})`);

    // Create tile DOM element
    const tileElement = document.createElement('div');
    tileElement.classList.add('tile', `tile-${type.toLowerCase()}`);
    tileElement.id = tileId;
    
    // Set grid position and size
    tileElement.style.gridColumn = `${position[0] + 1} / span ${width}`;
    tileElement.style.gridRow = `${position[1] + 1} / span ${height}`;
    
    // Base tile styling
    tileElement.style.cssText += `
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: var(--tile-background, #fff);
      border: 1px solid var(--tile-border, #e0e0e0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Create tile instance
    const tileInstance = this.createTileInstance(tileId, type, device, config, tileElement);
    
    if (!tileInstance) {
      console.error(`Failed to create tile instance for type: ${type}`);
      return null;
    }

    // Register tile
    this.tiles.set(tileId, tileInstance);

    // Render tile content
    tileInstance.render();

    // Add to container
    targetContainer.appendChild(tileElement);

    console.log(`✅ Created and registered tile: ${tileId} (${type})`);
    return tileElement;
  }

  /**
   * Get a tile by ID
   */
  public getTile(tileId: string): BaseTile | undefined {
    return this.tiles.get(tileId);
  }

  /**
   * Remove a tile
   */
  public removeTile(tileId: string): void {
    const tile = this.tiles.get(tileId);
    if (tile) {
      tile.destroy();
      this.tiles.delete(tileId);
      console.log(`🗑️ Removed tile: ${tileId}`);
    }
  }

  /**
   * Clear all tiles
   */
  public clearAllTiles(): void {
    this.tiles.forEach((tile) => {
      tile.destroy();
    });
    this.tiles.clear();
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    console.log('🧹 Cleared all tiles');
  }

  /**
   * Update device state across all relevant tiles
   */
  public updateDeviceState(deviceId: string, capability: string, newValue: any): void {
    let updatedCount = 0;
    
    this.tiles.forEach((tile) => {
      if ((tile as any).device?.id === deviceId) {
        tile.update(newValue, capability);
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      console.log(`🔄 Updated ${updatedCount} tiles for device ${deviceId}`);
    }
  }

  /**
   * Get all tiles for a specific device
   */
  public getTilesForDevice(deviceId: string): BaseTile[] {
    const deviceTiles: BaseTile[] = [];
    
    this.tiles.forEach((tile) => {
      if ((tile as any).device?.id === deviceId) {
        deviceTiles.push(tile);
      }
    });
    
    return deviceTiles;
  }

  /**
   * Get tile registry stats
   */
  public getStats(): { totalTiles: number; tilesByType: Record<string, number> } {
    const stats = {
      totalTiles: this.tiles.size,
      tilesByType: {} as Record<string, number>
    };

    this.tiles.forEach((tile) => {
      const type = tile.constructor.name;
      stats.tilesByType[type] = (stats.tilesByType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 1. Render a complete dashboard with multiple pages
   */
  public renderDashboard(
    pages: DashboardPage[],
    _settings: any,
    devices: HomeyDevice[]
  ): void {
    console.log('🎨 Rendering dashboard with', pages.length, 'pages and', devices.length, 'devices');
    
    if (!this.container) {
      console.error('Container not available for dashboard rendering');
      return;
    }

    // Store pages and devices for navigation
    this.pages = pages;
    this.currentPageIndex = 0;
    
    // Clear existing content
    this.clearAllTiles();
    
    // Convert devices array to map for efficient lookup
    this.deviceMap.clear();
    devices.forEach(device => {
      this.deviceMap.set(device.id, device);
    });

    // Set up the main dashboard container
    this.container.innerHTML = '';
    this.container.className = 'dashboard-container';

    // Create navigation if there are multiple pages with icons
    if (pages.length > 1 && pages.some(page => page.icon)) {
      this.createNavigation(pages);
    }

    // Render all pages (hidden except first one)
    pages.forEach((page, pageIndex) => {
      this.renderPage(page, this.deviceMap, pageIndex);
    });

    console.log(`🎨 Dashboard rendered with ${this.tiles.size} total tiles`);
  }

  /**
   * 2. Render a page with its groups
   */
  public renderPage(
    page: DashboardPage,
    devices: Map<string, HomeyDevice>,
    pageIndex: number = 0
  ): void {
    if (!this.container) {
      console.error('Container not available for page rendering');
      return;
    }

    console.log(`📄 Rendering page ${pageIndex} with ${page.group.length} groups`);

    // Create page container
    const pageContainer = document.createElement('div');
    pageContainer.className = 'dashboard-page page';
    pageContainer.id = `page-${pageIndex}`;
    pageContainer.style.cssText = `
      display: ${pageIndex === 0 ? 'grid' : 'none'};
      gap: 16px;
      padding: 16px;
      width: 100%;
      height: 100%;
    `;

    // Render each group
    page.group.forEach((group, groupIndex) => {
      this.renderGroup(group, devices, pageIndex, groupIndex, pageContainer);
    });

    // Add page to main container
    this.container.appendChild(pageContainer);

    console.log(`📄 Rendered page ${pageIndex} with ${page.group.length} groups`);
  }

  /**
   * 3. Render a group with its tiles
   */
  public renderGroup(
    group: Group,
    devices: Map<string, HomeyDevice>,
    pageIndex: number,
    groupIndex: number,
    parentContainer: HTMLElement
  ): void {
    console.log(`📦 Rendering group ${groupIndex} with ${group.items.length} tiles`);

    // Create group container
    const groupContainer = document.createElement('div');
    groupContainer.className = 'group';
    groupContainer.id = `page-${pageIndex}-group-${groupIndex}`;
    
    // TODO handle more styles via css to enable better theming
    // Set up group layout based on group dimensions
    groupContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${group.width}, 1fr);
      grid-template-rows: repeat(${group.height}, 1fr);
      gap: 8px;
      border-radius: 8px;
      padding: 8px;
      `;
    //   border: 1px solid var(--group-border, #e0e0e0);
    //   background: var(--group-background, #fafafa);

    // Add group title if provided
    if (group.title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'group-title';
      titleElement.textContent = group.title;
      titleElement.style.cssText = `
        grid-column: 1 / -1;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-color, #333);
      `;
      groupContainer.appendChild(titleElement);
    }

    // Render tiles in this group
    group.items.forEach((item, itemIndex) => {
      const deviceId = (item as any).id;
      const device = deviceId ? devices.get(deviceId) : null;
      const tileId = `page-${pageIndex}-group-${groupIndex}-tile-${itemIndex}`;
      
      this.createTile(
        tileId,
        item.type,
        device || null,
        item,
        item.position,
        item.width,
        item.height,
        groupContainer
      );
    });

    // Add group to page container
    parentContainer.appendChild(groupContainer);

    console.log(`📦 Rendered group ${groupIndex} with ${group.items.length} tiles`);
  }

  /**
   * Create navigation bar for multi-page dashboards
   */
  private createNavigation(pages: DashboardPage[]): void {
    if (!this.container) return;

    // Create navigation container
    const navPage = document.createElement('div');
    navPage.id = 'navPage';
    navPage.className = 'nav-page';
    
    // Check orientation for responsive design
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    if (orientation === 'portrait') {
      navPage.classList.add('portrait');
    }

    // Create page button container
    const pageButtonContainer = document.createElement('div');
    pageButtonContainer.id = 'pageButtonContainer';
    pageButtonContainer.className = 'page-button-container';
    if (orientation === 'portrait') {
      pageButtonContainer.classList.add('portrait');
    }

    // Create page buttons
    pages.forEach((page, pageIndex) => {
      if (page.icon) {
        const pageButton = document.createElement('div');
        pageButton.id = `pageButton-${pageIndex}`;
        pageButton.className = 'pageButton';
        pageButton.dataset.targetPage = pageIndex.toString();
        
        // Set active for first page
        if (pageIndex === 0) {
          pageButton.classList.add('active');
        }

        // Add click handler
        pageButton.addEventListener('click', () => {
          this.navigateToPage(pageIndex);
        });

        // Create icon
        const pageIcon = document.createElement('div');
        pageIcon.className = `pageIcon mdi ${page.icon}`;

        pageButton.appendChild(pageIcon);
        pageButtonContainer.appendChild(pageButton);
      }
    });

    navPage.appendChild(pageButtonContainer);
    this.container.appendChild(navPage);

    console.log('🧭 Navigation created with', pages.length, 'page buttons');
  }

  /**
   * Navigate to a specific page
   */
  private navigateToPage(targetPageIndex: number): void {
    console.log(`🧭 Navigating to page ${targetPageIndex}`);

    // Update active button
    const allPageButtons = document.querySelectorAll('.pageButton');
    allPageButtons.forEach((button, index) => {
      if (index === targetPageIndex) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Show/hide pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach((page, index) => {
      const pageElement = page as HTMLElement;
      if (index === targetPageIndex) {
        pageElement.style.display = 'grid';
      } else {
        pageElement.style.display = 'none';
      }
    });

    this.currentPageIndex = targetPageIndex;
    console.log(`✅ Navigated to page ${targetPageIndex}`);
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
    if (this.currentPageIndex < this.pages.length - 1) {
      this.navigateToPage(this.currentPageIndex + 1);
    }
  }

  /**
   * Switch to previous page
   */
  public previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.navigateToPage(this.currentPageIndex - 1);
    }
  }

  /**
   * Update devices in the tile renderer
   */
  public updateDevices(devices: HomeyDevice[]): void {
    console.log('🔄 Updating devices in tile renderer:', devices.length, 'devices');
    
    devices.forEach(device => {
      // Update all tiles that use this device
      const deviceTiles = this.getTilesForDevice(device.id);
      deviceTiles.forEach(_tile => {
        // Trigger a re-render or update for this tile
        console.log(`🔄 Updating tile for device: ${device.name}`);
        // The tile should handle its own updates through device listeners
      });
    });
  }
}
