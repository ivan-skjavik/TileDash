import { HomeyDevice, Tile, getTileDeviceCapabilities } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export abstract class BaseTile {
	protected deviceMap: Map<string, HomeyDevice>;
	protected config: Tile;
	protected element: HTMLElement;
	protected homeyApi: HomeyAPIV3LocalPatched;
	protected tileId: string;
	private eventCleanupCallbacks: ( () => void )[] = [];
	private deviceCapabilityMap: Array<{ deviceId: string; capabilityId: string; alias?: string }>;

	constructor(
		tileId: string,
		devices: HomeyDevice[],
		config: Tile,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		this.tileId = tileId;
		this.config = config;
		this.element = element;
		this.homeyApi = homeyApi;
		
		// Create device map for fast lookups
		this.deviceMap = new Map();
		devices.forEach( device => this.deviceMap.set( device.id, device ) );
		
		// Extract device-capability combinations from config
		this.deviceCapabilityMap = getTileDeviceCapabilities( config );
		
		console.log( `🔧 BaseTile initialized with ${devices.length} devices and ${this.deviceCapabilityMap.length} device-capability combinations` );
	}

/**
 * Initial rendering of the tile
 */
abstract render(): void;

/**
 * Update tile when device state changes
 * @param newValue - The new value from the device capability
 * @param capabilityId - The capability that changed
 * @param deviceId - The device that changed (for multi-device tiles)
 */
abstract update( newValue: any, capabilityId: string, deviceId?: string ): void;

/**
 * Setup event listeners for this tile
 */
protected async setupEventListeners(): Promise<void> {
	if ( this.deviceCapabilityMap.length === 0 ) {
		console.warn( `No device-capability mappings found for tile ${this.tileId}` );
		return;
	}

	try {
		// Set up listeners for each device-capability combination
		for ( const mapping of this.deviceCapabilityMap ) {
			const device = this.deviceMap.get( mapping.deviceId );
			if ( !device ) {
				console.warn( `Device ${mapping.deviceId} not found for tile ${this.tileId}` );
				continue;
			}

			// Create capability instance listener
			const cleanup = device.makeCapabilityInstance( mapping.capabilityId, ( newValue: any ) => {
				this.handleDeviceUpdate( newValue, undefined, mapping.deviceId, mapping.capabilityId );
			} );

			// Store cleanup callback if the API provides one
			if ( typeof cleanup === 'function' ) {
				this.eventCleanupCallbacks.push( cleanup );
			}

			console.log( `✅ Setup device listener for tile ${this.tileId}:${mapping.deviceId}:${mapping.capabilityId}` );
		}
	} catch ( error ) {
		console.error( `❌ Failed to setup device listeners for tile ${this.tileId}:`, error );
	}
}

/**
 * Handle device state updates
 */
protected handleDeviceUpdate( newValue: any, oldValue: any, deviceId: string, capabilityId: string ): void {
	console.log( `🔄 Device update for tile ${this.tileId}:`, { deviceId, capabilityId, newValue, oldValue, } );
	this.update( newValue, capabilityId, deviceId );
}

// Utility methods for child classes
protected createIcon( iconName: string, size: number = 24 ): HTMLElement {
	const iconContainer = document.createElement( 'div' );
	iconContainer.classList.add( 'icon' );
	// TODO move to CSS
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
	// TODO move to CSS
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
	// TODO move to CSS
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

protected getCapabilityValue( deviceId: string, capabilityId: string ): any {
	const device = this.deviceMap.get( deviceId );
	if ( !device || !capabilityId ) return undefined;
	
	const capability = device.capabilitiesObj[capabilityId];
	return capability ? capability.value : undefined;
}

protected getCapability( deviceId: string, capabilityId: string ): any {
	const device = this.deviceMap.get( deviceId );
	if ( !device || !capabilityId ) return undefined;
	
	return device.capabilitiesObj[capabilityId];
}

/**
 * Get the first device-capability combination for this tile (for backward compatibility)
 */
protected getPrimaryDeviceCapability(): { deviceId: string; capabilityId: string } | undefined {
	return this.deviceCapabilityMap[0];
}

/**
 * Get all device-capability combinations for this tile
 */
protected getAllDeviceCapabilities(): Array<{ deviceId: string; capabilityId: string; alias?: string }> {
	return [ ...this.deviceCapabilityMap, ];
}

/**
 * Get a device by ID
 */
protected getDevice( deviceId: string ): HomeyDevice | undefined {
	return this.deviceMap.get( deviceId );
}

/**
 * Get all devices for this tile
 */
protected getAllDevices(): HomeyDevice[] {
	return Array.from( this.deviceMap.values() );
}

/**
 * Check if this tile has multiple devices
 */
protected isMultiDevice(): boolean {
	return this.deviceMap.size > 1;
}

/**
 * Check if this tile has multiple capabilities (across all devices)
 */
protected hasMultipleCapabilities(): boolean {
	return this.deviceCapabilityMap.length > 1;
}

/**
 * Set capability value for a specific device
 */
protected async setCapabilityValue( deviceId: string, capabilityId: string, value: any ): Promise<void> {
	try {
		await this.homeyApi.devices.setCapabilityValue( {
			deviceId,
			capabilityId,
			value,
		} );
	} catch ( error ) {
		console.error( `Failed to set capability value for ${deviceId}:${capabilityId}:`, error );
		throw error;
	}
}

/**
 * Set capability value for all devices with the given capability
 */
protected async setCapabilityValueAll( capabilityId: string, value: any ): Promise<void> {
	const promises = this.deviceCapabilityMap
		.filter( mapping => mapping.capabilityId === capabilityId )
		.map( mapping => this.setCapabilityValue( mapping.deviceId, capabilityId, value ) );
	
	await Promise.all( promises );
}

/**
 * Legacy method for backward compatibility - gets the capability ID from the first device
 * @deprecated Use getPrimaryDeviceCapability() instead
 */
protected getCapabilityID(): string | undefined {
	const primary = this.getPrimaryDeviceCapability();
	return primary?.capabilityId;
}

/**
 * Legacy method for backward compatibility - gets the device ID from the first device
 * @deprecated Use getPrimaryDeviceCapability() instead
 */
protected getDeviceID(): string | undefined {
	const primary = this.getPrimaryDeviceCapability();
	return primary?.deviceId;
}

/**
 * Check if this tile is connected to a device
 */
protected isDeviceTile(): boolean {
	return this.deviceCapabilityMap.length > 0;
}

/**
 * Cleanup method to remove event listeners
 */
public cleanup(): void {
	this.eventCleanupCallbacks.forEach( cleanup => cleanup() );
	this.eventCleanupCallbacks = [];
}

/**
 * Get device IDs used by this tile (public method for external access)
 */
public getDeviceIds(): string[] {
	return Array.from( this.deviceMap.keys() );
}

// HMR Support - Public getters for tile reconstruction
public get tileConfig(): Tile {
	return this.config;
}

public get tileElement(): HTMLElement {
	return this.element;
}

public get tileDevices(): HomeyDevice[] {
	return Array.from( this.deviceMap.values() );
}

public get api(): HomeyAPIV3LocalPatched {
	return this.homeyApi;
}
}
