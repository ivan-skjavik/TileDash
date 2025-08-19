import { HomeyDevice, ImageTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class ImageTileRenderer extends BaseTileRenderer {
  
  render( _device: HomeyDevice | null, tile: ImageTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'image-tile' );
    
    // Create image container
    const imageContainer = document.createElement( 'div' );
    imageContainer.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    `;

    // Add background image if specified
    if ( tile.staticImage ) {
      const imageUrl = tile.staticImage;
      imageContainer.style.backgroundImage = `url(${imageUrl})`;
      imageContainer.style.backgroundSize = 'cover';
      imageContainer.style.backgroundPosition = 'center';
      imageContainer.style.backgroundRepeat = 'no-repeat';
    } else if ( tile.folder ) {
      // Handle folder-based image rotation
      this.setupImageRotation( imageContainer, tile );
    }

    // Add overlay for better text visibility
    if ( tile.name || tile.icon ) {
      const overlay = document.createElement( 'div' );
      overlay.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      // Add icon if specified
      if ( tile.icon ) {
        const iconElement = this.createIcon( tile.icon, 24, options );
        iconElement.style.color = 'white';
        overlay.appendChild( iconElement );
      }

      // Add name if specified
      if ( tile.name ) {
        const nameElement = this.createName( tile.name, true );
        nameElement.style.color = 'white';
        nameElement.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
        overlay.appendChild( nameElement );
      }

      imageContainer.appendChild( overlay );
    }

    container.appendChild( imageContainer );
    this.applyThemeStyles( container, options );
  }

  private setupImageRotation( container: HTMLElement, tile: ImageTile ): void {
    // TODO: Implement image rotation for folder-based images
    // This would require loading images from the specified folder
    // and rotating them based on timeScroll interval
    
    if ( tile.folder ) {
      // For now, just set a placeholder
      container.style.backgroundColor = '#f0f0f0';
      const placeholder = document.createElement( 'div' );
      placeholder.style.cssText = `
        color: #999;
        font-size: 12px;
        text-align: center;
      `;
      placeholder.textContent = `Images from: ${tile.folder}`;
      container.appendChild( placeholder );
    }
  }
}
