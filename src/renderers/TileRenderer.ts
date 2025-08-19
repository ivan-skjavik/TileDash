import { Tile, Group, DashboardPage, HomeyDevice } from '../types';

export class TileRenderer {
  private container: HTMLElement | null;
  private currentDevices: HomeyDevice[] = [];

  constructor( containerId: string ) {
    console.log( 'TileRenderer: Constructor called with containerId:', containerId );
    this.container = document.getElementById( containerId );
    
    if ( !this.container ) {
      console.error( `TileRenderer: Container with id '${containerId}' not found!` );
    } else {
      console.log( 'TileRenderer: Container found successfully', this.container );
      // Add a test element to verify the renderer is working
      const testElement = document.createElement( 'div' );
      testElement.innerHTML = '<p style="color: red; font-size: 20px;">TileRenderer is working!</p>';
      testElement.className = 'tile-renderer-test';
      this.container.appendChild( testElement );
    }
  }

  public renderDashboard( pages: DashboardPage[], settings: any, devices: any[] = [] ): void {
    console.log( 'TileRenderer: Starting dashboard render with', {
      pagesCount: pages.length,
      devicesCount: devices.length,
      settings
    } );
    
    if ( !this.container ) {
      console.error( 'TileRenderer: Container not found!' );
      return;
    }

    // Clear existing content
    this.container.innerHTML = '';

    // Set dashboard-level classes and styles
    this.applyDashboardStyling( settings );

    // For development, show all pages. In production, you might want to show one at a time
    pages.forEach( ( page, pageIndex ) => {
      console.log( `TileRenderer: Rendering page ${pageIndex + 1} with ${page.group?.length || 0} groups` );
      this.renderPage( page, pageIndex, devices );
    } );
    
    console.log( 'TileRenderer: Dashboard render complete' );
  }

  private applyDashboardStyling( settings: any ): void {
    if ( !this.container ) return;
    
    const orientation = settings.orientation || 'landscape';
    
    if ( orientation === 'portrait' ) {
      this.container.style.justifyContent = 'center';
      this.container.style.gridAutoFlow = 'row';
    } else {
      this.container.style.gridAutoFlow = 'column';
      this.container.style.justifyContent = 'center';
      this.container.style.alignItems = 'center';
      this.container.style.gridAutoRows = 'max-content';
    }

    // Apply background image if specified
    if ( settings.backgroundImage ) {
      document.body.style.background = `url("${settings.backgroundImage}")`;
      document.body.style.backgroundSize = 'cover';
    }
  }

  private renderPage( page: DashboardPage, pageIndex: number, settings: any ): HTMLElement {
    const pageElement = document.createElement( 'div' );
    pageElement.classList.add( 'page' );
    pageElement.id = `page-${pageIndex}`;
    
    const orientation = settings.orientation || 'landscape';
    if ( orientation === 'portrait' ) {
      pageElement.style.flexDirection = 'column';
    }

    // Hide all pages except the first one
    if ( pageIndex !== 0 ) {
      pageElement.style.display = 'none';
    }

    // Render groups within the page
    page.group.forEach( ( group, groupIndex ) => {
      const groupElement = this.renderGroup( group, groupIndex, settings );
      pageElement.appendChild( groupElement );
    } );

    this.container?.appendChild( pageElement );
    
    return pageElement;
  }

  private renderGroup( group: Group, groupIndex: number, settings: any ): HTMLElement {
    const tileSize = settings.tileSize || 80;
    const tileMargin = settings.tileMargin || 5;
    const groupMargin = settings.groupMargin || 10;
    const orientation = settings.orientation || 'landscape';

    const groupWidth = tileSize * group.width + ( group.width + 1 ) * tileMargin;
    const groupHeight = tileSize * group.height + ( group.height + 1 ) * tileMargin;

    const groupElement = document.createElement( 'div' );
    groupElement.classList.add( 'group' );
    groupElement.style.width = `${groupWidth}px`;
    groupElement.style.height = `${groupHeight}px`;
    groupElement.style.gap = `${tileMargin}px`;
    groupElement.style.padding = `${tileMargin}px`;
    groupElement.style.display = 'grid';
    groupElement.style.gridTemplateColumns = `repeat(${group.width}, ${tileSize}px)`;
    groupElement.style.gridTemplateRows = `repeat(${group.height}, ${tileSize}px)`;

    // Apply margins
    if ( orientation !== 'portrait' && groupIndex !== 0 ) {
      groupElement.style.marginLeft = `${groupMargin}px`;
    }

    if ( orientation === 'portrait' ) {
      if ( groupIndex !== 0 ) {
        groupElement.style.marginTop = '5rem';
      }
    }

    // Add group title if specified
    if ( group.title ) {
      const titleElement = document.createElement( 'div' );
      titleElement.classList.add( 'groupName' );
      titleElement.textContent = group.title;
      groupElement.appendChild( titleElement );
    }

    // Render items within the group
    group.items.forEach( ( item: Tile ) => {
      const device = this.findDevice( 'id' in item ? item.id : undefined );
      const tileElement = this.renderTile( item, device, tileSize, tileMargin );
      groupElement.appendChild( tileElement );
    } );

    return groupElement;
  }

  private renderTile( item: Tile, device: HomeyDevice | null, tileSize: number, tileMargin: number ): HTMLElement {
    const tileWidth = tileSize * item.width + ( item.width - 1 ) * tileMargin;
    const tileHeight = tileSize * item.height + ( item.height - 1 ) * tileMargin;

    const tileElement = document.createElement( 'div' );
    tileElement.classList.add( 'tile' );
    tileElement.id = `tile-${'id' in item ? item.id : 'virtual'}-${Date.now()}`;
    tileElement.style.width = `${tileWidth}px`;
    tileElement.style.height = `${tileHeight}px`;
    tileElement.style.gridRow = `${item.position[1] + 1} / span ${item.height}`;
    tileElement.style.gridColumn = `${item.position[0] + 1} / span ${item.width}`;

    // Render tile content based on type
    switch ( item.type ) {
      case 'VIRTUAL':
        this.renderVirtualTile( tileElement, item );
        break;
      case 'SWITCH':
        this.renderSwitchTile( tileElement, item, device );
        break;
      case 'SENSOR':
        this.renderSensorTile( tileElement, item, device );
        break;
      case 'BINARY_SENSOR':
        this.renderBinarySensorTile( tileElement, item, device );
        break;
      case 'IMAGE':
        this.renderImageTile( tileElement, item );
        break;
      case 'BUTTON':
        this.renderButtonTile( tileElement, item, device );
        break;
      case 'SLIDER':
        this.renderSliderTile( tileElement, item, device );
        break;
      default:
        this.renderDefaultTile( tileElement, item );
        break;
    }

    return tileElement;
  }

  private renderVirtualTile( element: HTMLElement, item: Tile ): void {
    element.classList.add( 'virtual-tile' );
    
    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      background: var(--tile-bg, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      border: 1px solid var(--tile-border, rgba(255, 255, 255, 0.2));
    `;

    // Add icon if specified
    if ( item.icon ) {
      const iconElement = document.createElement( 'div' );
      iconElement.classList.add( 'tile-icon', 'mdi', item.icon );
      iconElement.style.cssText = `
        font-size: 2rem;
        margin-bottom: 8px;
        color: var(--tile-icon-color, #fff);
      `;
      content.appendChild( iconElement );
    }

    // Add name/title
    if ( item.name ) {
      const nameElement = document.createElement( 'div' );
      nameElement.classList.add( 'tile-name' );
      nameElement.textContent = item.name;
      nameElement.style.cssText = `
        font-size: 0.9rem;
        text-align: center;
        color: var(--tile-text-color, #fff);
        line-height: 1.2;
      `;
      content.appendChild( nameElement );
    }

    element.appendChild( content );
  }

  private renderSwitchTile( element: HTMLElement, item: Tile, device: HomeyDevice | null ): void {
    element.classList.add( 'switch-tile' );
    
    if ( !device ) {
      this.renderOfflineTile( element, item, 'Device not found' );
      return;
    }

    const capabilityID = 'capabilityID' in item ? item.capabilityID : 'onoff';
    if ( !capabilityID ) return;
    
    const capability = device.capabilitiesObj[capabilityID];
    const isOn = capability?.value === true;

    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      background: ${isOn ? 'var(--tile-bg-active, rgba(76, 175, 80, 0.3))' : 'var(--tile-bg, rgba(255, 255, 255, 0.1))'};
      border-radius: 8px;
      border: 1px solid ${isOn ? 'var(--tile-border-active, #4CAF50)' : 'var(--tile-border, rgba(255, 255, 255, 0.2))'};
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    // Add icon
    const iconElement = document.createElement( 'div' );
    iconElement.classList.add( 'tile-icon', 'mdi', item.icon || 'mdi-lightbulb' );
    iconElement.style.cssText = `
      font-size: 2rem;
      margin-bottom: 8px;
      color: ${isOn ? 'var(--tile-icon-color-active, #4CAF50)' : 'var(--tile-icon-color, #fff)'};
    `;
    content.appendChild( iconElement );

    // Add device name
    const nameElement = document.createElement( 'div' );
    nameElement.classList.add( 'tile-name' );
    nameElement.textContent = item.name || device.name;
    nameElement.style.cssText = `
      font-size: 0.9rem;
      text-align: center;
      color: var(--tile-text-color, #fff);
      line-height: 1.2;
    `;
    content.appendChild( nameElement );

    // Add click handler
    content.addEventListener( 'click', () => {
      const deviceId = 'id' in item ? item.id : '';
      if ( deviceId ) {
        this.toggleSwitch( deviceId, capabilityID, !isOn );
      }
    } );

    element.appendChild( content );
  }

  private renderSensorTile( element: HTMLElement, item: Tile, device: HomeyDevice | null ): void {
    element.classList.add( 'sensor-tile' );
    
    if ( !device ) {
      this.renderOfflineTile( element, item, 'Device not found' );
      return;
    }

    const capabilityID = 'capabilityID' in item ? item.capabilityID : Object.keys( device.capabilitiesObj )[0];
    if ( !capabilityID ) return;
    
    const capability = device.capabilitiesObj[capabilityID];
    const value = capability?.value;
    const unit = capability?.units || ( 'unit' in item ? item.unit : '' ) || '';

    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      background: var(--tile-bg, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      border: 1px solid var(--tile-border, rgba(255, 255, 255, 0.2));
    `;

    // Add icon
    if ( item.icon ) {
      const iconElement = document.createElement( 'div' );
      iconElement.classList.add( 'tile-icon', 'mdi', item.icon );
      iconElement.style.cssText = `
        font-size: 1.5rem;
        margin-bottom: 8px;
        color: var(--tile-icon-color, #fff);
      `;
      content.appendChild( iconElement );
    }

    // Add value
    const valueElement = document.createElement( 'div' );
    valueElement.classList.add( 'tile-value' );
    valueElement.textContent = `${value}${unit}`;
    valueElement.style.cssText = `
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 4px;
      color: var(--tile-text-color, #fff);
    `;
    content.appendChild( valueElement );

    // Add device name
    const nameElement = document.createElement( 'div' );
    nameElement.classList.add( 'tile-name' );
    nameElement.textContent = item.name || device.name;
    nameElement.style.cssText = `
      font-size: 0.8rem;
      text-align: center;
      color: var(--tile-text-color-secondary, rgba(255, 255, 255, 0.8));
      line-height: 1.2;
    `;
    content.appendChild( nameElement );

    element.appendChild( content );
  }

  private renderBinarySensorTile( element: HTMLElement, item: Tile, device: HomeyDevice | null ): void {
    // Similar to sensor but for boolean values
    this.renderSensorTile( element, item, device );
    element.classList.add( 'binary-sensor-tile' );
  }

  private renderImageTile( element: HTMLElement, _item: Tile ): void {
    element.classList.add( 'image-tile' );
    
    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
      background: var(--tile-bg, rgba(255, 255, 255, 0.1));
      border: 1px solid var(--tile-border, rgba(255, 255, 255, 0.2));
    `;

    // For now, just show a placeholder
    const placeholderElement = document.createElement( 'div' );
    placeholderElement.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--tile-text-color, #fff);
      font-size: 0.9rem;
    `;
    placeholderElement.textContent = 'Image Tile';
    content.appendChild( placeholderElement );

    element.appendChild( content );
  }

  private renderButtonTile( element: HTMLElement, item: Tile, device: HomeyDevice | null ): void {
    element.classList.add( 'button-tile' );
    
    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      background: var(--tile-bg, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      border: 1px solid var(--tile-border, rgba(255, 255, 255, 0.2));
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    content.addEventListener( 'mousedown', () => {
      content.style.transform = 'scale(0.95)';
    } );

    content.addEventListener( 'mouseup', () => {
      content.style.transform = 'scale(1)';
    } );

    // Add icon
    if ( item.icon ) {
      const iconElement = document.createElement( 'div' );
      iconElement.classList.add( 'tile-icon', 'mdi', item.icon );
      iconElement.style.cssText = `
        font-size: 2rem;
        margin-bottom: 8px;
        color: var(--tile-icon-color, #fff);
      `;
      content.appendChild( iconElement );
    }

    // Add button name
    const nameElement = document.createElement( 'div' );
    nameElement.classList.add( 'tile-name' );
    nameElement.textContent = item.name || 'Button';
    nameElement.style.cssText = `
      font-size: 0.9rem;
      text-align: center;
      color: var(--tile-text-color, #fff);
      line-height: 1.2;
    `;
    content.appendChild( nameElement );

    // Add click handler
    content.addEventListener( 'click', () => {
      if ( device ) {
        const deviceId = 'id' in item ? item.id : '';
        const capabilityID = 'capabilityID' in item ? item.capabilityID : 'button';
        if ( deviceId && capabilityID ) {
          this.triggerButton( deviceId, capabilityID );
        }
      }
    } );

    element.appendChild( content );
  }

  private renderSliderTile( element: HTMLElement, item: Tile, _device: HomeyDevice | null ): void {
    // Placeholder for slider implementation
    this.renderDefaultTile( element, item );
    element.classList.add( 'slider-tile' );
  }

  private renderDefaultTile( element: HTMLElement, item: Tile ): void {
    element.classList.add( 'default-tile' );
    
    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      background: var(--tile-bg, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      border: 1px solid var(--tile-border, rgba(255, 255, 255, 0.2));
    `;

    const typeElement = document.createElement( 'div' );
    typeElement.textContent = `${item.type} Tile`;
    typeElement.style.cssText = `
      font-size: 0.9rem;
      color: var(--tile-text-color, #fff);
      margin-bottom: 4px;
    `;
    content.appendChild( typeElement );

    if ( item.name ) {
      const nameElement = document.createElement( 'div' );
      nameElement.textContent = item.name;
      nameElement.style.cssText = `
        font-size: 0.8rem;
        color: var(--tile-text-color-secondary, rgba(255, 255, 255, 0.8));
        text-align: center;
      `;
      content.appendChild( nameElement );
    }

    element.appendChild( content );
  }

  private renderOfflineTile( element: HTMLElement, _item: Tile, message: string ): void {
    element.classList.add( 'offline-tile' );
    
    const content = document.createElement( 'div' );
    content.classList.add( 'tile-content' );
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      background: var(--tile-bg-error, rgba(244, 67, 54, 0.2));
      border-radius: 8px;
      border: 1px solid var(--tile-border-error, #F44336);
    `;

    const iconElement = document.createElement( 'div' );
    iconElement.classList.add( 'tile-icon', 'mdi', 'mdi-alert-circle' );
    iconElement.style.cssText = `
      font-size: 1.5rem;
      margin-bottom: 8px;
      color: var(--tile-icon-color-error, #F44336);
    `;
    content.appendChild( iconElement );

    const messageElement = document.createElement( 'div' );
    messageElement.textContent = message;
    messageElement.style.cssText = `
      font-size: 0.8rem;
      text-align: center;
      color: var(--tile-text-color-error, #F44336);
      line-height: 1.2;
    `;
    content.appendChild( messageElement );

    element.appendChild( content );
  }

  private findDevice( deviceId?: string ): HomeyDevice | null {
    if ( !deviceId ) return null;
    return this.currentDevices.find( device => device.id === deviceId ) || null;
  }

  // Initialize page navigation (for multi-page dashboards)
  public initializePageNavigation( pages: DashboardPage[] ): void {
    // Create navigation container if it doesn't exist
    let navContainer = document.getElementById( 'navPage' );
    if ( !navContainer ) {
      navContainer = document.createElement( 'div' );
      navContainer.id = 'navPage';
      navContainer.classList.add( 'page-navigation' );
      this.container?.parentElement?.insertBefore( navContainer, this.container );
    }

    // Create page buttons
    const buttonContainer = document.createElement( 'div' );
    buttonContainer.id = 'pageButtonContainer';
    buttonContainer.classList.add( 'page-button-container' );

    pages.forEach( ( page, index ) => {
      if ( page.icon ) {
        const button = document.createElement( 'div' );
        button.classList.add( 'pageButton' );
        button.id = `pageButton-${index}`;
        button.dataset.targetPage = index.toString();
        
        if ( index === 0 ) {
          button.classList.add( 'active' );
        }

        const icon = document.createElement( 'div' );
        icon.classList.add( 'pageIcon', 'mdi', page.icon );
        button.appendChild( icon );

        button.addEventListener( 'click', () => {
          this.navigateToPage( index );
        } );

        buttonContainer.appendChild( button );
      }
    } );

    navContainer.appendChild( buttonContainer );
  }

  private navigateToPage( targetPageIndex: number ): void {
    // Update button states
    const buttons = document.querySelectorAll( '.pageButton' );
    buttons.forEach( ( button, index ) => {
      if ( index === targetPageIndex ) {
        button.classList.add( 'active' );
      } else {
        button.classList.remove( 'active' );
      }
    } );

    // Update page visibility
    const pages = document.querySelectorAll( '.page' );
    pages.forEach( ( page, index ) => {
      const pageElement = page as HTMLElement;
      if ( index === targetPageIndex ) {
        pageElement.style.display = 'flex';
      } else {
        pageElement.style.display = 'none';
      }
    } );
  }

  // Methods to be called by the API integration
  private async toggleSwitch( deviceId: string, capabilityId: string, value: boolean ): Promise<void> {
    console.log( `Toggle switch: ${deviceId}, ${capabilityId} = ${value}` );
    // This will be implemented when we integrate with HomeyClient
    // For now, just log the action
    
    // Dispatch custom event for state management
    window.dispatchEvent( new CustomEvent( 'deviceStateChange', {
      detail: { deviceId, capabilityId, value, oldValue: !value }
    } ) );
  }

  private async triggerButton( deviceId: string, capabilityId: string ): Promise<void> {
    console.log( `Trigger button: ${deviceId}, ${capabilityId}` );
    // This will be implemented when we integrate with HomeyClient
  }

  public updateDevices( devices: HomeyDevice[] ): void {
    this.currentDevices = devices;
    // Re-render tiles with updated device data
    // This would be called when device states change
  }
}

export default TileRenderer;
