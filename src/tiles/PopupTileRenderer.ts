import { HomeyDevice, PopupTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class PopupTileRenderer extends BaseTileRenderer {
  
  render( device: HomeyDevice | null, tile: PopupTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'popup-tile' );
    
    // Add icon
    if ( tile.icon ) {
      const iconElement = this.createIcon( tile.icon, 32, options );
      container.appendChild( iconElement );
    }

    // Add name
    if ( tile.name ) {
      const nameElement = this.createName( tile.name );
      container.appendChild( nameElement );
    }

    // Add click handler to show popup
    this.addClickHandler( container, device, tile, () => {
      this.showPopup( tile, options );
    } );

    this.applyThemeStyles( container, options );
  }

  private showPopup( tile: PopupTile, _options: TileRenderOptions ): void {
    // Create popup overlay
    const overlay = document.createElement( 'div' );
    overlay.classList.add( 'popup-overlay' );
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Create popup content
    const popup = document.createElement( 'div' );
    popup.classList.add( 'popup-content' );
    popup.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      position: relative;
    `;

    // Add close button
    const closeButton = document.createElement( 'button' );
    closeButton.innerHTML = '<i class="mdi mdi-close"></i>';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `;
    closeButton.addEventListener( 'click', () => {
      document.body.removeChild( overlay );
    } );
    popup.appendChild( closeButton );

    // Add popup title
    if ( tile.name ) {
      const title = document.createElement( 'h3' );
      title.textContent = tile.name;
      title.style.cssText = `
        margin: 0 0 20px 0;
        text-align: center;
        color: #333;
      `;
      popup.appendChild( title );
    }

    // Placeholder for popup items
    const itemsContainer = document.createElement( 'div' );
    itemsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${tile.popupWidth}, 1fr);
      grid-template-rows: repeat(${tile.popupHeight}, 1fr);
      gap: 10px;
      width: 400px;
      height: 300px;
    `;
    
    // TODO: Render popup items
    const placeholder = document.createElement( 'div' );
    placeholder.style.cssText = `
      grid-column: 1 / -1;
      grid-row: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    `;
    placeholder.textContent = 'Popup items will be rendered here';
    itemsContainer.appendChild( placeholder );
    
    popup.appendChild( itemsContainer );
    overlay.appendChild( popup );
    document.body.appendChild( overlay );

    // Close on overlay click
    overlay.addEventListener( 'click', ( e ) => {
      if ( e.target === overlay ) {
        document.body.removeChild( overlay );
      }
    } );
  }
}
