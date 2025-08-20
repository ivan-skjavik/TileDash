import { BaseTile } from './BaseTile';
import { HomeyDevice, SliderTile as SliderTileConfig } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class SliderTile extends BaseTile {
	private sliderElement: HTMLInputElement | null = null;
	private valueDisplay: HTMLElement | null = null;
	private sliderConfig: SliderTileConfig;

	constructor(
		tileId: string,
		device: HomeyDevice | null,
		config: SliderTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, device, config, element, homeyApi );
		this.sliderConfig = config;
	}

	protected getCapabilityID(): string | undefined {
		return this.sliderConfig.capabilityID;
	}

	render(): void {
		this.element.classList.add( 'slider-tile' );
		this.element.classList.add( 'sliderTile' ); // Add the original CSS class
		this.element.innerHTML = ''; // Clear existing content

		const config = this.sliderConfig;

		// Add icon
		if ( config.icon ) {
			const iconElement = this.createIcon( config.icon, 24 );
			this.element.appendChild( iconElement );
		}

		// Add name
		if ( config.name ) {
			const nameElement = this.createNameElement( config.name, true );
			this.element.appendChild( nameElement );
		}

		// Add value display and slider
		if ( this.device && config.capabilityID ) {
			const capability = this.getCapability();
			const currentValue = this.getCapabilityValue() || 0;

			// Create value display
			this.valueDisplay = this.createValueElement(
				this.formatValue( currentValue, capability ),
				capability?.units || config.unit || '',
				'12px'
			);
			this.element.appendChild( this.valueDisplay );

			// Create slider
			this.createSlider( capability, currentValue );

			// Add 'on' class if value > 0 (like original implementation)
			if ( parseFloat( String( currentValue ) ) > 0 ) {
				this.element.classList.add( 'on' );
			}
		}

		// Setup event listeners
		this.setupEventListeners().catch( error => {
			console.error( `Failed to setup event listeners for SliderTile ${this.tileId}:`, error );
		} );

		console.log( `🎛️ Rendered SliderTile: ${this.tileId}` );
	}

	private createSlider( capability: any, currentValue: number ): void {
		const sliderContainer = document.createElement( 'div' );
		sliderContainer.classList.add( 'sliderContainer' );
        // TODO move to CSS
		sliderContainer.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin: 8px 0;
      padding: 0 8px;
    `;

		console.log( 'capability:', capability, this.sliderConfig );

		this.sliderElement = document.createElement( 'input' );
		this.sliderElement.type = 'range';
		this.sliderElement.classList.add( 'sliderTrack' );
		this.sliderElement.min = String( this.sliderConfig.minValue || 0 );
		this.sliderElement.max = String( this.sliderConfig.maxValue || 100 );
		this.sliderElement.step = String( this.sliderConfig.step || 0.05 );
		this.sliderElement.value = String( currentValue );
		this.sliderElement.style.width = '100%';

		// Add both input and change event listeners like the original
		this.sliderElement.addEventListener( 'input', ( e ) => {
			const target = e.target as HTMLInputElement;
			const newValue = parseFloat( target.value );
			this.updateSliderVisual( target, newValue );
			this.updateValueDisplay( newValue );
		} );

		this.sliderElement.addEventListener( 'change', ( e ) => {
			const target = e.target as HTMLInputElement;
			const newValue = parseFloat( target.value );
			this.handleSliderChange( newValue );
		} );

		// Initialize visual appearance
		this.updateSliderVisual( this.sliderElement, currentValue );

		sliderContainer.appendChild( this.sliderElement );
		this.element.appendChild( sliderContainer );
	}

	private async handleSliderChange( value: number ): Promise<void> {
		const capabilityID = this.getCapabilityID();
		if ( !this.device || !capabilityID ) return;

		try {
			console.log( `🎛️ Slider changed: ${this.device.name} ${capabilityID} = ${value}` );
      
			// Send to Homey using proper API method
			await this.homeyApi.devices.setCapabilityValue( {
				deviceId: this.device.id,
				capabilityId: capabilityID,
				value: value,
			} );
      
			this.showClickFeedback();
		} catch ( error ) {
			console.error( 'Error setting slider value:', error );
			// Revert display on error
			const originalValue = this.getCapabilityValue();
			this.updateValueDisplay( originalValue );
			if ( this.sliderElement ) {
				this.sliderElement.value = String( originalValue );
				this.updateSliderVisual( this.sliderElement, originalValue );
			}
		}
	}

	/**
   * Update slider visual appearance with gradient background like the original
   */
	private updateSliderVisual( slider: HTMLInputElement, value: number ): void {
		const percentage = ( value / parseFloat( slider.max ) ) * 100;
    
		// Get CSS custom properties for colors (fallback to defaults if not available)
		const root = document.documentElement;
		const primColor = getComputedStyle( root ).getPropertyValue( '--sliderPrimColor' )?.trim() || '#007acc';
		const secColor = getComputedStyle( root ).getPropertyValue( '--sliderSecColor' )?.trim() || '#cacaca';
    
		// Apply gradient background like the original implementation
		slider.style.background = `linear-gradient(to right, ${primColor} ${percentage}%, ${secColor} ${percentage}%)`;
	}

	update( newValue: any, capability: string ): void {
		const capabilityID = this.getCapabilityID();
		if ( capability !== capabilityID ) return;

		console.log( `🔄 Updating SliderTile ${this.tileId} with value:`, newValue );

		// Update value display
		this.updateValueDisplay( newValue );

		// Update slider position and visual appearance
		if ( this.sliderElement ) {
			this.sliderElement.value = String( newValue );
			this.updateSliderVisual( this.sliderElement, newValue );
		}

		// Update 'on' class based on value (like original implementation)
		const numValue = parseFloat( String( newValue ) );
		if ( numValue > 0 ) {
			this.element.classList.add( 'on' );
		} else {
			this.element.classList.remove( 'on' );
		}
	}

	private updateValueDisplay( value: any ): void {
		if ( !this.valueDisplay ) return;

		const capability = this.getCapability();
		const formattedValue = this.formatValue( value, capability );
		const unit = capability?.units || this.sliderConfig.unit || '';
    
		this.valueDisplay.textContent = `${formattedValue}${unit}`;
	}
}
