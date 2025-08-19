import { HomeyDevice, VirtualTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class VirtualTileRenderer extends BaseTileRenderer {
  
  render( _device: HomeyDevice | null, tile: VirtualTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'virtual-tile' );
    
    // Add icon if provided
    if ( tile.icon ) {
      const iconElement = this.createIcon( tile.icon, 32, options );
      container.appendChild( iconElement );
    }

    // Add name if provided
    if ( tile.name ) {
      const nameElement = this.createName( tile.name );
      container.appendChild( nameElement );
    }

    // Virtual tiles are typically not interactive
    container.style.opacity = '0.7';
    container.style.cursor = 'default';

    // Apply theme styles
    this.applyThemeStyles( container, options );
  }
}
