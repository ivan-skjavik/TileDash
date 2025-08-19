import { HomeyDevice, SwitchTile, TileRenderOptions } from '../types';
import { BaseTileRenderer } from './BaseTileRenderer';

export class SwitchTileRenderer extends BaseTileRenderer {
  
  render( device: HomeyDevice | null, tile: SwitchTile, container: HTMLElement, options: TileRenderOptions ): void {
    container.classList.add( 'switch-tile' );
    
    if ( !device ) {
      this.renderOfflineDevice( container, tile );
      return;
    }

    const capability = device.capabilitiesObj[tile.capabilityID];
    if ( !capability ) {
      this.renderMissingCapability( container, tile );
      return;
    }

    const isOn = Boolean( capability.value );
    
    // Update tile state
    container.classList.toggle( 'on', isOn );
    
    // Add icon with state handling
    const iconName = this.getIconForState( tile, isOn );
    const iconElement = this.createIcon( iconName, 32, options );
    
    // Add effects if configured
    this.applyIconEffects( iconElement.querySelector( 'i' ) as HTMLElement, tile, isOn );
    
    container.appendChild( iconElement );

    // Add name if provided
    if ( tile.name ) {
      const nameElement = this.createName( tile.name );
      container.appendChild( nameElement );
    }

    // Add click handler if not explicitly disabled
    if ( tile.clickable !== false && capability.setable ) {
      this.addClickHandler( container, device, tile );
    }

    // Set up real-time updates
    this.addDeviceListener( device, tile.capabilityID, ( newValue: any ) => {
      const newIsOn = Boolean( newValue );
      container.classList.toggle( 'on', newIsOn );
      
      // Update icon
      const newIconName = this.getIconForState( tile, newIsOn );
      const iconEl = iconElement.querySelector( 'i' ) as HTMLElement;
      
      if ( iconEl ) {
        // Remove old icon classes
        iconEl.className = iconEl.className.replace( /mdi-[^\s]+/g, '' );
        iconEl.classList.add( 'mdi', newIconName );
        this.applyIconEffects( iconEl, tile, newIsOn );
      }
    } );

    // Apply theme styles
    this.applyThemeStyles( container, options );
  }

  private getIconForState( tile: SwitchTile, isOn: boolean ): string {
    if ( tile.icons ) {
      return isOn ? tile.icons.on : tile.icons.off;
    }
    return tile.icon || 'mdi-lightbulb';
  }

  private applyIconEffects( iconElement: HTMLElement, tile: SwitchTile, isOn: boolean ): void {
    if ( !iconElement ) return;

    // Remove existing effects
    if ( tile.effectOn ) iconElement.classList.remove( tile.effectOn );
    if ( tile.effectOff ) iconElement.classList.remove( tile.effectOff );

    // Apply current effect
    if ( isOn && tile.effectOn ) {
      iconElement.classList.add( tile.effectOn );
    } else if ( !isOn && tile.effectOff ) {
      iconElement.classList.add( tile.effectOff );
    }
  }

  private renderOfflineDevice( container: HTMLElement, tile: SwitchTile ): void {
    container.innerHTML = `
      <div class="offline-device">
        <i class="mdi mdi-cloud-off-outline" style="font-size: 24px; color: #999;"></i>
        <div style="font-size: 10px; margin-top: 4px; color: #999;">
          ${tile.name || 'Device offline'}
        </div>
      </div>
    `;
    container.style.opacity = '0.5';
  }

  private renderMissingCapability( container: HTMLElement, _tile: SwitchTile ): void {
    container.innerHTML = `
      <div class="missing-capability">
        <i class="mdi mdi-alert-circle-outline" style="font-size: 24px; color: #ff9800;"></i>
        <div style="font-size: 10px; margin-top: 4px; color: #ff9800;">
          Capability not found
        </div>
      </div>
    `;
  }
}
