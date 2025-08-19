import { HomeyDevice, ButtonTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class ButtonTileRenderer extends BaseTileRenderer {
  
  render( device: HomeyDevice | null, tile: ButtonTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'button-tile' );
    
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

    // Add value if available
    if ( device && tile.capabilityID ) {
      const value = this.getDeviceCapabilityValue( device, tile.capabilityID );
      if ( value !== undefined ) {
        const valueElement = this.createValueElement( this.formatValue( value, tile ), options );
        container.appendChild( valueElement );
      }
    }

    // Add click handler for button action
    this.addClickHandler( container, device, tile, () => {
      this.handleButtonClick( device, tile, options );
    } );

    // Set visual state for button
    this.updateButtonState( container, device, tile, options );
  }

  private handleButtonClick( device: HomeyDevice | null, tile: ButtonTile, options: TileRenderOptions ): void {
    if ( !device || !tile.capabilityID ) {
      console.warn( 'Button click: Missing device or capability' );
      return;
    }

    try {
      // Set button value to true (buttons typically trigger actions)
      const buttonValue = true;
      
      if ( options.homeyApiService ) {
        // Visual feedback
        const button = document.querySelector( `[data-tile-id="${tile.id || ''}"]` ) as HTMLElement;
        if ( button ) {
          button.classList.add( 'button-pressed' );
          setTimeout( () => {
            button.classList.remove( 'button-pressed' );
          }, 200 );
        }

        options.homeyApiService.setCapabilityValue( device.id, tile.capabilityID, buttonValue )
          .then( () => {
            console.log( `Button clicked: ${device.name} ${tile.capabilityID} = ${buttonValue}` );
          } )
          .catch( ( error: Error ) => {
            console.error( 'Button click failed:', error );
            this.showErrorFeedback( button );
          } );
      }
    } catch ( error ) {
      console.error( 'Button click error:', error );
    }
  }

  private updateButtonState( container: HTMLElement, device: HomeyDevice | null, tile: ButtonTile, _options: TileRenderOptions ): void {
    // Add visual styling for button state
    if ( device && tile.capabilityID ) {
      const value = this.getDeviceCapabilityValue( device, tile.capabilityID );
      
      if ( value ) {
        container.classList.add( 'button-active' );
      } else {
        container.classList.remove( 'button-active' );
      }
    }
  }

  private showErrorFeedback( button: HTMLElement | null ): void {
    if ( button ) {
      button.classList.add( 'button-error' );
      setTimeout( () => {
        button.classList.remove( 'button-error' );
      }, 1000 );
    }
  }
}
