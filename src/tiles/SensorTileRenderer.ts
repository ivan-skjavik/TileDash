import { HomeyDevice, SensorTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class SensorTileRenderer extends BaseTileRenderer {
  
  render( device: HomeyDevice | null, tile: SensorTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'sensor-tile', 'on' );
    
    if ( !device ) {
      this.renderOfflineDevice( container, tile );
      return;
    }

    const capability = device.capabilitiesObj[tile.capabilityID];
    if ( !capability ) {
      this.renderMissingCapability( container, tile );
      return;
    }

    const isSmallDevice = tile.width <= 1;
    
    // Create main container for sensor values
    const valueContainer = document.createElement( 'div' );
    valueContainer.classList.add( 'sensor-value-container' );
    valueContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    `;

    // Create first value container
    const firstValueContainer = document.createElement( 'div' );
    firstValueContainer.classList.add( 'first-value-container' );
    firstValueContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 4px;
    `;

    // Add icon
    if ( tile.icon ) {
      const iconSize = isSmallDevice ? 18 : 24;
      const iconElement = this.createIcon( tile.icon, iconSize, options );
      firstValueContainer.appendChild( iconElement );
      
      if ( options?.smooth ) {
        const iconEl = iconElement.querySelector( 'i' );
        if ( iconEl ) iconEl.classList.add( 'smooth-icon-on' );
      }
    }

    // Add primary value
    const value = this.formatValue( capability.value, capability );
    const primaryValue = this.createValue( value, tile.unit, isSmallDevice ? '12px' : '16px' );
    firstValueContainer.appendChild( primaryValue );

    valueContainer.appendChild( firstValueContainer );

    // Add second value if configured
    if ( tile.secondValue ) {
      const secondCapability = device.capabilitiesObj[tile.secondValue.capabilityID];
      if ( secondCapability ) {
        const secondContainer = document.createElement( 'div' );
        secondContainer.classList.add( 'second-value-container' );
        secondContainer.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSmallDevice ? '10px' : '12px'};
          color: var(--secondary-color, #666);
          margin-top: 2px;
        `;

        if ( tile.secondValue.icon ) {
          const secondIcon = document.createElement( 'i' );
          secondIcon.classList.add( 'mdi', tile.secondValue.icon );
          secondIcon.style.cssText = `
            font-size: ${isSmallDevice ? '12px' : '14px'};
            margin-right: 4px;
          `;
          secondContainer.appendChild( secondIcon );
        }

        const secondValue = this.formatValue( secondCapability.value, secondCapability );
        const secondValueText = document.createElement( 'span' );
        secondValueText.textContent = `${secondValue}${tile.secondValue.unit || ''}`;
        secondContainer.appendChild( secondValueText );

        valueContainer.appendChild( secondContainer );

        // Set up listener for second value
        this.addDeviceListener( device, tile.secondValue.capabilityID, ( newValue: any ) => {
          const formattedValue = this.formatValue( newValue, secondCapability );
          secondValueText.textContent = `${formattedValue}${tile.secondValue!.unit || ''}`;
        } );
      }
    }

    container.appendChild( valueContainer );

    // Add name if provided
    if ( tile.name ) {
      const nameElement = this.createName( tile.name, isSmallDevice );
      nameElement.style.marginTop = '4px';
      container.appendChild( nameElement );
    }

    // Set up real-time updates for primary value
    this.addDeviceListener( device, tile.capabilityID, ( newValue: any ) => {
      const formattedValue = this.formatValue( newValue, capability );
      primaryValue.textContent = `${formattedValue}${tile.unit || ''}`;
    } );

    // Apply theme styles
    this.applyThemeStyles( container, options );
  }

  private renderOfflineDevice( container: HTMLElement, tile: SensorTile ): void {
    container.innerHTML = `
      <div class="offline-device">
        <i class="mdi mdi-cloud-off-outline" style="font-size: 24px; color: #999;"></i>
        <div style="font-size: 10px; margin-top: 4px; color: #999;">
          ${tile.name || 'Sensor offline'}
        </div>
      </div>
    `;
    container.style.opacity = '0.5';
  }

  private renderMissingCapability( container: HTMLElement, tile: SensorTile ): void {
    container.innerHTML = `
      <div class="missing-capability">
        <i class="mdi mdi-alert-circle-outline" style="font-size: 24px; color: #ff9800;"></i>
        <div style="font-size: 10px; margin-top: 4px; color: #ff9800;">
          Capability not found
        </div>
        <div style="font-size: 8px; margin-top: 2px; color: #ff9800;">
          ${tile.capabilityID}
        </div>
      </div>
    `;
  }
}
