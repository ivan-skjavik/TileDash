import { HomeyDevice, Tile } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export abstract class BaseTile {
	protected device: HomeyDevice | null;
	protected config: Tile;
	protected element: HTMLElement;
	protected homeyApi: HomeyAPIV3LocalPatched;
	protected tileId: string;
	private eventCleanupCallbacks: ( () => void )[] = [];

	constructor(
		tileId: string,
		device: HomeyDevice | null,
		config: Tile,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		this.tileId = tileId;
		this.device = device;
		this.config = config;
		this.element = element;
		this.homeyApi = homeyApi;
	}

/**
 * Initial rendering of the tile
 */
abstract render(): void;

/**
 * Update tile when device state changes
 */
abstract update( newValue: any, capability: string ): void;

/**
 * Setup event listeners for this tile
 */
protected async setupEventListeners(): Promise<void> {
	const capabilityID = this.getCapabilityID();
	if ( !this.device || !capabilityID ) return;

	try {
		// Get the device from the HomeyAPI
		const device = await this.homeyApi.devices.getDevice( { id: this.device.id, } );
		
		// Use makeCapabilityInstance to listen for capability changes
		device.makeCapabilityInstance( capabilityID, ( newValue: any ) => {
			// We don't have access to the old value in this API, so pass undefined
			this.handleDeviceUpdate( newValue, undefined );
		} );

		console.log( `✅ Setup device listener for tile ${this.tileId}:${this.device.id}:${capabilityID}` );
		
		// Store cleanup function (though HomeyAPI doesn't provide direct removal)
		const cleanup = () => {
			console.log( `🔄 Cleanup requested for tile ${this.tileId} (HomeyAPI doesn't support direct listener removal)` );
		};

		this.eventCleanupCallbacks.push( cleanup );
		
	} catch ( error ) {
		console.error( `❌ Failed to setup device listener for tile ${this.tileId}:`, error );
	}
}

/**
 * Handle device state updates
 */
protected handleDeviceUpdate( newValue: any, oldValue: any ): void {
	const capabilityID = this.getCapabilityID();
	console.log( `🔄 Device update for tile ${this.tileId}:`, { newValue, oldValue, } );
	if ( capabilityID ) {
		this.update( newValue, capabilityID );
	}
}

/**
 * Cleanup tile resources
 */
public destroy(): void {
// Clean up event listeners
	this.eventCleanupCallbacks.forEach( cleanup => cleanup() );
	this.eventCleanupCallbacks = [];

	// Remove from DOM if still attached
	if ( this.element.parentNode ) {
		this.element.parentNode.removeChild( this.element );
	}

	console.log( `🗑️ Destroyed tile: ${this.tileId}` );
}

// Utility methods for child classes
protected createIcon( iconName: string, size: number = 24 ): HTMLElement {
	const iconContainer = document.createElement( 'div' );
	iconContainer.classList.add( 'icon' );
	iconContainer.style.cssText = `
display: flex;
justify-content: center;
align-items: center;
margin-bottom: 4px;
`;

	const icon = document.createElement( 'i' );
	icon.classList.add( 'mdi', iconName );
	icon.style.fontSize = `${size}px`;
	iconContainer.appendChild( icon );

	return iconContainer;
}

protected createNameElement( name: string, small: boolean = false ): HTMLElement {
	const nameElement = document.createElement( 'div' );
	nameElement.classList.add( 'tile-name' );
	nameElement.textContent = name;
	nameElement.style.cssText = `
font-size: ${small ? '10px' : '12px'};
font-weight: 500;
text-align: center;
margin-top: 4px;
color: var(--text-color, #333);
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
max-width: 100%;
`;
	return nameElement;
}

protected createValueElement( value: any, unit: string = '', size: string = '14px' ): HTMLElement {
	const valueElement = document.createElement( 'div' );
	valueElement.classList.add( 'tile-value' );
	valueElement.textContent = `${value}${unit}`;
	valueElement.style.cssText = `
font-size: ${size};
font-weight: 600;
text-align: center;
color: var(--value-color, #2196F3);
margin: 4px 0;
`;
	return valueElement;
}

protected formatValue( value: any, capability?: any ): string {
	if ( value === null || value === undefined ) return '—';

	if ( typeof value === 'boolean' ) {
		return value ? 'On' : 'Off';
	}

	if ( typeof value === 'number' ) {
		const decimals = capability?.decimals || 1;
		return value.toFixed( decimals );
	}

	return String( value );
}

protected showClickFeedback(): void {
	this.element.style.transform = 'scale(0.95)';
	this.element.style.opacity = '0.7';

	setTimeout( () => {
		this.element.style.transform = 'scale(1)';
		this.element.style.opacity = '1';
	}, 150 );
}

protected getCapabilityValue(): any {
	const capabilityID = this.getCapabilityID();
	if ( !this.device || !capabilityID ) return undefined;
	const capability = this.device.capabilitiesObj[capabilityID];
	return capability ? capability.value : undefined;
}

protected getCapability(): any {
	const capabilityID = this.getCapabilityID();
	if ( !this.device || !capabilityID ) return undefined;
	return this.device.capabilitiesObj[capabilityID];
}

/**
 * Get the capability ID for this tile - subclasses can override this
 */
protected getCapabilityID(): string | undefined {
// Default implementation - try to access capabilityID property
	return ( this.config as any ).capabilityID;
}
}
