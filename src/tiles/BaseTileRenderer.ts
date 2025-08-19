import { HomeyDevice, Tile, TileRenderOptions, TileRenderer } from '../types';
import { homeyApi } from '../services/HomeyApiService';

export abstract class BaseTileRenderer implements TileRenderer {
  
  abstract render( device: HomeyDevice | null, tile: Tile, container: HTMLElement, options: TileRenderOptions ): void;

  protected createIcon( iconName: string, size?: number, options?: TileRenderOptions ): HTMLElement {
    const iconContainer = document.createElement( 'div' );
    iconContainer.classList.add( 'icon' );
    iconContainer.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 4px;
    `;

    const icon = document.createElement( 'i' );
    icon.classList.add( 'mdi', iconName );
    
    let iconSize = size || 24;
    if ( options?.ratio ) {
      iconSize = iconSize / options.ratio;
    }
    
    icon.style.fontSize = `${iconSize}px`;
    iconContainer.appendChild( icon );
    
    return iconContainer;
  }

  protected createName( name: string, small = false ): HTMLElement {
    const nameElement = document.createElement( 'div' );
    nameElement.classList.add( 'tile-name' );
    nameElement.textContent = name;
    nameElement.style.cssText = `
      font-size: ${small ? '10px' : '12px'};
      font-weight: 500;
      text-align: center;
      margin-top: 4px;
      color: var(--text-color, #333);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    `;
    return nameElement;
  }

  protected createValue( value: any, unit = '', size = '14px' ): HTMLElement {
    const valueElement = document.createElement( 'div' );
    valueElement.classList.add( 'tile-value' );
    valueElement.textContent = `${value}${unit}`;
    valueElement.style.cssText = `
      font-size: ${size};
      font-weight: 600;
      text-align: center;
      color: var(--value-color, #2196F3);
      margin: 4px 0;
    `;
    return valueElement;
  }

  protected addClickHandler( 
    element: HTMLElement, 
    device: HomeyDevice | null, 
    tile: any, 
    callback?: () => void 
  ): void {
    element.style.cursor = 'pointer';
    
    element.addEventListener( 'click', async ( e ) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        if ( callback ) {
          callback();
        } else if ( device && tile.capabilityID && 'setable' in device.capabilitiesObj[tile.capabilityID] ) {
          // Default toggle behavior for boolean capabilities
          const capability = device.capabilitiesObj[tile.capabilityID];
          if ( capability.type === 'boolean' && capability.setable ) {
            const newValue = !capability.value;
            await homeyApi.setCapabilityValue( device.id, tile.capabilityID, newValue );
            
            // Provide visual feedback
            this.showClickFeedback( element );
          }
        }
      } catch ( error ) {
        console.error( 'Error handling tile click:', error );
      }
    } );
  }

  protected showClickFeedback( element: HTMLElement ): void {
    element.style.transform = 'scale(0.95)';
    element.style.opacity = '0.7';
    
    setTimeout( () => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    }, 150 );
  }

  protected formatValue( value: any, capability?: any ): string {
    if ( value === null || value === undefined ) return '—';
    
    if ( typeof value === 'boolean' ) {
      return value ? 'On' : 'Off';
    }
    
    if ( typeof value === 'number' ) {
      const decimals = capability?.decimals || 1;
      return value.toFixed( decimals );
    }
    
    return String( value );
  }

  protected getDeviceCapabilityValue( device: HomeyDevice, capabilityID: string ): any {
    const capability = device.capabilitiesObj[capabilityID];
    return capability ? capability.value : undefined;
  }

  protected createValueElement( text: string, options?: TileRenderOptions ): HTMLElement {
    const valueElement = document.createElement( 'div' );
    valueElement.classList.add( 'tile-value' );
    valueElement.textContent = text;
    valueElement.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      color: var(--value-color, #2196F3);
      margin: 4px 0;
    `;
    
    if ( options?.isDarkTheme ) {
      valueElement.style.color = '#ffffff';
    }
    
    return valueElement;
  }

  protected addDeviceListener( 
    device: HomeyDevice, 
    capabilityId: string, 
    callback: ( value: any, oldValue: any ) => void 
  ): void {
    homeyApi.addDeviceListener( device.id, capabilityId, callback );
  }

  protected applyThemeStyles( element: HTMLElement, options?: TileRenderOptions ): void {
    if ( options?.smooth ) {
      element.classList.add( 'smooth-tile' );
    }
  }
}
