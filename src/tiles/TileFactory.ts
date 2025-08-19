import { HomeyDevice, Tile, TileRenderOptions, TileFactory as ITileFactory } from '../types';
import { SwitchTileRenderer } from './SwitchTileRenderer';
import { SensorTileRenderer } from './SensorTileRenderer';
import { VirtualTileRenderer } from './VirtualTileRenderer';
import { SliderTileRenderer } from './SliderTileRenderer';
import { ImageTileRenderer } from './ImageTileRenderer';
import { PopupTileRenderer } from './PopupTileRenderer';
import { ButtonTileRenderer } from './ButtonTileRenderer';

export class TileFactory implements ITileFactory {
  private renderers = new Map<string, any>();

  constructor() {
    // Register tile renderers
    this.renderers.set( 'SWITCH', new SwitchTileRenderer() );
    this.renderers.set( 'SENSOR', new SensorTileRenderer() );
    this.renderers.set( 'VIRTUAL', new VirtualTileRenderer() );
    this.renderers.set( 'SLIDER', new SliderTileRenderer() );
    this.renderers.set( 'IMAGE', new ImageTileRenderer() );
    this.renderers.set( 'POPUP', new PopupTileRenderer() );
    this.renderers.set( 'VIRTUAL_POPUP', new PopupTileRenderer() );
    this.renderers.set( 'BUTTON', new ButtonTileRenderer() );
    // TODO: Add other tile types as they are created
  }

  createTile( device: HomeyDevice | null, tile: Tile, options: TileRenderOptions ): HTMLElement {
    // Create base tile element
    const tileElement = document.createElement( 'div' );
    tileElement.classList.add( 'tile', `tile-${tile.type.toLowerCase()}` );
    tileElement.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--tile-background, #fff);
      border: 1px solid var(--tile-border, #e0e0e0);
    `;

    // Add tile name if provided
    if ( tile.name ) {
      tileElement.setAttribute( 'data-name', tile.name );
      tileElement.title = tile.name;
    }

    // Add device ID for reference
    if ( device ) {
      tileElement.setAttribute( 'data-device-id', device.id );
    }

    // Get appropriate renderer
    const renderer = this.renderers.get( tile.type );
    if ( renderer ) {
      try {
        renderer.render( device, tile, tileElement, options );
      } catch ( error ) {
        console.error( `Error rendering tile type ${tile.type}:`, error );
        this.renderErrorTile( tileElement, tile, error );
      }
    } else {
      console.warn( `No renderer found for tile type: ${tile.type}` );
      this.renderUnsupportedTile( tileElement, tile );
    }

    return tileElement;
  }

  private renderErrorTile( element: HTMLElement, tile: Tile, error: any ): void {
    element.innerHTML = `
      <div class="tile-error">
        <i class="mdi mdi-alert-circle" style="font-size: 24px; color: #f44336;"></i>
        <div style="font-size: 12px; text-align: center; margin-top: 4px;">
          Error: ${tile.type}
        </div>
        <div style="font-size: 10px; opacity: 0.7; text-align: center;">
          ${error.message || 'Unknown error'}
        </div>
      </div>
    `;
    element.style.background = '#ffebee';
  }

  private renderUnsupportedTile( element: HTMLElement, tile: Tile ): void {
    element.innerHTML = `
      <div class="tile-unsupported">
        <i class="mdi mdi-help-circle" style="font-size: 24px; color: #ff9800;"></i>
        <div style="font-size: 12px; text-align: center; margin-top: 4px;">
          ${tile.type}
        </div>
        <div style="font-size: 10px; opacity: 0.7; text-align: center;">
          Not supported
        </div>
      </div>
    `;
    element.style.background = '#fff3e0';
  }

  // Register a new tile renderer
  registerRenderer( type: string, renderer: any ): void {
    this.renderers.set( type, renderer );
  }

  // Get available tile types
  getAvailableTypes(): string[] {
    return Array.from( this.renderers.keys() );
  }
}
