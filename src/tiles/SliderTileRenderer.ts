import { HomeyDevice, SliderTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class SliderTileRenderer extends BaseTileRenderer {
  
  render( device: HomeyDevice | null, tile: SliderTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'slider-tile' );
    
    // Add icon
    if ( tile.icon ) {
      const iconElement = this.createIcon( tile.icon, 24, options );
      container.appendChild( iconElement );
    }

    // Add name
    if ( tile.name ) {
      const nameElement = this.createName( tile.name, true );
      container.appendChild( nameElement );
    }

    // Add value display and slider
    if ( device && tile.capabilityID ) {
      const capability = device.capabilitiesObj[tile.capabilityID];
      const currentValue = capability ? capability.value : 0;
      
      // Create value display
      const valueElement = this.createValue( 
        this.formatValue( currentValue, capability ), 
        capability?.units || tile.unit || '', 
        '12px' 
      );
      container.appendChild( valueElement );

      // Create slider
      const slider = this.createSlider( device, tile, currentValue, capability, options );
      container.appendChild( slider );
    }

    this.applyThemeStyles( container, options );
  }

  private createSlider( 
    device: HomeyDevice, 
    tile: SliderTile, 
    currentValue: number, 
    capability: any, 
    options: TileRenderOptions 
  ): HTMLElement {
    const sliderContainer = document.createElement( 'div' );
    sliderContainer.style.cssText = `
      width: 100%;
      margin-top: 8px;
      padding: 0 8px;
    `;

    const slider = document.createElement( 'input' );
    slider.type = 'range';
    slider.min = String( capability?.min || tile.minValue || 0 );
    slider.max = String( capability?.max || tile.maxValue || 100 );
    slider.step = String( capability?.step || tile.step || 1 );
    slider.value = String( currentValue || 0 );
    
    slider.style.cssText = `
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: var(--slider-track-color, #ddd);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    `;

    // Add slider thumb styling
    const style = document.createElement( 'style' );
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--slider-thumb-color, #2196F3);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--slider-thumb-color, #2196F3);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild( style );

    // Add change handler
    let timeout: NodeJS.Timeout;
    slider.addEventListener( 'input', () => {
      // Update value display immediately
      const valueElement = sliderContainer.parentElement?.querySelector( '.tile-value' );
      if ( valueElement ) {
        valueElement.textContent = `${slider.value}${capability?.units || tile.unit || ''}`;
      }

      // Debounce API calls
      clearTimeout( timeout );
      timeout = setTimeout( () => {
        this.handleSliderChange( device, tile, Number( slider.value ), options );
      }, 300 );
    } );

    sliderContainer.appendChild( slider );
    return sliderContainer;
  }

  private handleSliderChange( 
    device: HomeyDevice, 
    tile: SliderTile, 
    value: number, 
    options: TileRenderOptions 
  ): void {
    if ( options.homeyApiService ) {
      options.homeyApiService.setCapabilityValue( device.id, tile.capabilityID, value )
        .then( () => {
          console.log( `Slider changed: ${device.name} ${tile.capabilityID} = ${value}` );
        } )
        .catch( ( error: Error ) => {
          console.error( 'Slider change failed:', error );
          // Could revert slider value here
        } );
    }
  }
}
