import { BaseTile } from './BaseTile';
import { HomeyDevice, SensorTile as SensorTileConfig } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class SensorTile extends BaseTile {
	private valueDisplay: HTMLElement | null = null;
	private sensorConfig: SensorTileConfig;

	constructor(
		tileId: string,
		device: HomeyDevice | null,
		config: SensorTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, device, config, element, homeyApi );
		this.sensorConfig = config;
	}

	protected getCapabilityID(): string | undefined {
		return this.sensorConfig.capabilityID;
	}

	render(): void {
		this.element.classList.add( 'sensor-tile' );
		this.element.innerHTML = ''; // Clear existing content

		const config = this.sensorConfig;
		const currentValue = this.getCapabilityValue();
		const capability = this.getCapability();

		// Add icon
		if ( config.icon ) {
			const iconElement = this.createIcon( config.icon, 28 );
			this.element.appendChild( iconElement );
		}

		// Add name
		if ( config.name ) {
			const nameElement = this.createNameElement( config.name, true );
			this.element.appendChild( nameElement );
		}

		// Add value display
		this.valueDisplay = this.createValueElement(
			this.formatValue( currentValue, capability ),
			capability?.units || config.unit || '',
			'16px'
		);
		this.element.appendChild( this.valueDisplay );

		// Sensor tiles are read-only, so no click handlers needed
    
		// Setup event listeners for updates
		this.setupEventListeners().catch( error => {
			console.error( `Failed to setup event listeners for SensorTile ${this.tileId}:`, error );
		} );

		console.log( `📊 Rendered SensorTile: ${this.tileId}` );
	}

	update( newValue: any, capability: string ): void {
		const capabilityID = this.getCapabilityID();
		if ( capability !== capabilityID ) return;

		console.log( `🔄 Updating SensorTile ${this.tileId} with value:`, newValue );
		this.updateValueDisplay( newValue );
	}

	private updateValueDisplay( value: any ): void {
		if ( !this.valueDisplay ) return;

		const capability = this.getCapability();
		const formattedValue = this.formatValue( value, capability );
		const unit = capability?.units || this.sensorConfig.unit || '';
    
		this.valueDisplay.textContent = `${formattedValue}${unit}`;

		// Add visual feedback for value changes
		this.valueDisplay.style.transform = 'scale(1.1)';
		setTimeout( () => {
			if ( this.valueDisplay ) {
				this.valueDisplay.style.transform = 'scale(1)';
			}
		}, 200 );
	}
}
