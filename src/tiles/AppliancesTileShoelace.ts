import { BaseTile } from './BaseTile.js';
import { AppliancesTile as AppliancesTileConfig, HomeyDevice } from '../types.js';
import { HomeyAPIV3LocalPatched } from 'homey-api';

// Import Shoelace components
// import '@shoelace-style/shoelace/dist/components/switch/switch.js';
// import '@shoelace-style/shoelace/dist/components/range/range.js';
// import '@shoelace-style/shoelace/dist/components/badge/badge.js';
// import '@shoelace-style/shoelace/dist/components/icon/icon.js';

interface ApplianceDevice {
	id: string;
	device: HomeyDevice;
	capabilities: string[];
}

export class AppliancesTile extends BaseTile {
	private controlsContainer: HTMLElement;
	private leftColumn: HTMLElement;
	private rightColumn: HTMLElement;
	private nonDimmableDevices: ApplianceDevice[] = [];
	private dimmableDevices: ApplianceDevice[] = [];
	private controlElements: Map<string, HTMLElement> = new Map();
	
	// Debounced update functions to prevent rapid API calls
	private debouncedToggleUpdate = this.debounce( this.updateToggleDevice.bind( this ), 300 );
	private debouncedSliderUpdate = this.debounce( this.updateSliderDevice.bind( this ), 500 );

	constructor( 
		tileId: string,
		devices: HomeyDevice[],
		config: AppliancesTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, devices, config, element, homeyApi );
		this.controlsContainer = this.createControlsContainer();
		this.leftColumn = this.createColumn( 'left' );
		this.rightColumn = this.createColumn( 'right' );
		
		this.initializeApplianceDevices();
		this.createDeviceControls();
		
		// Setup event listeners for external updates
		this.setupEventListeners().catch( error => {
			console.error( `Failed to setup event listeners for AppliancesTileShoelace ${this.tileId}:`, error );
		} );
	}

	private createControlsContainer(): HTMLElement {
		const container = document.createElement( 'div' );
		container.className = 'appliances-tile__controls';
		return container;
	}

	private createColumn( side: 'left' | 'right' ): HTMLElement {
		const column = document.createElement( 'div' );
		column.className = `appliances-tile__column appliances-tile__column--${side}`;
		return column;
	}

	private initializeApplianceDevices(): void {
		// Get device configurations from tile config to determine column placement
		const deviceCapabilities = this.getAllDeviceCapabilities();
		
		for ( const mapping of deviceCapabilities ) {
			const device = this.deviceMap.get( mapping.deviceId );
			if ( !device ) continue;
			
			const applianceDevice: ApplianceDevice = {
				id: mapping.deviceId,
				device,
				capabilities: device.capabilities || [],
			};

			// Categorize based on the capability specified in tile config
			if ( mapping.capabilityId === 'dim' ) {
				this.dimmableDevices.push( applianceDevice );
			} else if ( mapping.capabilityId === 'onoff' ) {
				this.nonDimmableDevices.push( applianceDevice );
			}
		}

		console.log( `📝 Initialized AppliancesTileShoelace with ${this.nonDimmableDevices.length} switches and ${this.dimmableDevices.length} dimmers` );
	}

	private createDeviceControls(): void {
		// Create controls for non-dimmable devices (left column)
		this.nonDimmableDevices.forEach( appliance => {
			const controlElement = this.createShoelaceToggleControl( appliance );
			const controlKey = `${appliance.id}-onoff`;
			this.controlElements.set( controlKey, controlElement );
			this.leftColumn.appendChild( controlElement );
			console.log( `📝 Created Shoelace toggle control for ${appliance.device.name}` );
		} );

		// Create controls for dimmable devices (right column)
		this.dimmableDevices.forEach( appliance => {
			const controlElement = this.createShoelaceDimmerControl( appliance );
			const controlKey = `${appliance.id}-dim`;
			this.controlElements.set( controlKey, controlElement );
			this.rightColumn.appendChild( controlElement );
			console.log( `📝 Created Shoelace dimmer control for ${appliance.device.name}` );
		} );

		console.log( `📋 Total Shoelace control elements created: ${this.controlElements.size}` );
	}

	private createShoelaceToggleControl( appliance: ApplianceDevice ): HTMLElement {
		const { device, id, } = appliance;
		const isOnline = true; // HomeyDevice doesn't have available property - assume online
		const isOn = device.capabilitiesObj?.onoff?.value ?? false;

		// Create Shoelace switch
		const switchElement = document.createElement( 'sl-switch' ) as any;
		switchElement.checked = isOn;
		switchElement.disabled = !isOnline;
		switchElement.addEventListener( 'sl-change', ( e: any ) => {
			this.debouncedToggleUpdate( id, e.target.checked );
		} );

		// Create status badge
		const statusBadge = document.createElement( 'sl-badge' );
		statusBadge.setAttribute( 'variant', isOnline ? 'success' : 'neutral' );
		statusBadge.setAttribute( 'pill', '' );
		
		const statusIcon = document.createElement( 'sl-icon' );
		statusIcon.setAttribute( 'name', isOnline ? 'wifi' : 'wifi-off' );
		statusBadge.appendChild( statusIcon );

		// Create control container
		const controlItem = this.createControlItem( 
			device.name, 
			this.getDeviceSubtitle( device ), 
			switchElement,
			statusBadge,
			isOnline ? ( isOn ? 'active' : 'inactive' ) : 'unavailable'
		);

		return controlItem;
	}

	private createShoelaceDimmerControl( appliance: ApplianceDevice ): HTMLElement {
		const { device, id, } = appliance;
		const isOnline = true; // HomeyDevice doesn't have available property - assume online
		const dimValue = device.capabilitiesObj?.dim?.value ?? 0;
		const isOn = device.capabilitiesObj?.onoff?.value ?? false;
		
		// Convert 0-1 range to 0-100 for the slider
		const sliderValue = Math.round( dimValue * 100 );

		// Create Shoelace range slider
		const rangeElement = document.createElement( 'sl-range' ) as any;
		rangeElement.min = 0;
		rangeElement.max = 100;
		rangeElement.value = sliderValue;
		rangeElement.step = 1;
		rangeElement.disabled = !isOnline;
		rangeElement.label = `Brightness for ${device.name}`;
		
		// Add prefix icon and suffix text
		const prefixIcon = document.createElement( 'sl-icon' );
		prefixIcon.setAttribute( 'name', 'lightbulb' );
		prefixIcon.setAttribute( 'slot', 'prefix' );
		rangeElement.appendChild( prefixIcon );

		const suffixText = document.createElement( 'span' );
		suffixText.setAttribute( 'slot', 'suffix' );
		suffixText.textContent = '%';
		rangeElement.appendChild( suffixText );

		// Add event listener
		rangeElement.addEventListener( 'sl-change', ( e: any ) => {
			this.debouncedSliderUpdate( id, e.target.value );
		} );

		// Create status badge
		const statusBadge = document.createElement( 'sl-badge' );
		statusBadge.setAttribute( 'variant', isOnline ? 'success' : 'neutral' );
		statusBadge.setAttribute( 'pill', '' );
		
		const statusIcon = document.createElement( 'sl-icon' );
		statusIcon.setAttribute( 'name', isOnline ? 'wifi' : 'wifi-off' );
		statusBadge.appendChild( statusIcon );

		// Create control container
		const controlItem = this.createControlItem( 
			device.name, 
			this.getDeviceSubtitle( device ), 
			rangeElement,
			statusBadge,
			isOnline ? ( isOn && sliderValue > 0 ? 'active' : 'inactive' ) : 'unavailable'
		);

		return controlItem;
	}

	private createControlItem( 
		title: string, 
		subtitle: string, 
		control: HTMLElement,
		statusBadge: HTMLElement,
		state: 'active' | 'inactive' | 'unavailable' = 'inactive'
	): HTMLElement {
		const item = document.createElement( 'div' );
		item.className = `control-item control-item--${state}`;

		const header = document.createElement( 'div' );
		header.className = 'control-item__header';

		const info = document.createElement( 'div' );
		info.className = 'control-item__info';

		const titleElement = document.createElement( 'div' );
		titleElement.className = 'control-item__title';
		titleElement.textContent = title;

		const subtitleElement = document.createElement( 'div' );
		subtitleElement.className = 'control-item__subtitle';
		subtitleElement.textContent = subtitle;

		info.appendChild( titleElement );
		info.appendChild( subtitleElement );

		header.appendChild( info );
		header.appendChild( statusBadge );

		const controlContainer = document.createElement( 'div' );
		controlContainer.className = 'control-item__control';
		controlContainer.appendChild( control );

		item.appendChild( header );
		item.appendChild( controlContainer );

		return item;
	}

	private getDeviceSubtitle( device: HomeyDevice ): string {
		const zone = device.zone || 'Unknown Zone';
		const deviceClass = device.class || 'Device';
		return `${deviceClass} • ${zone}`;
	}

	private async updateToggleDevice( deviceId: string, value: boolean ): Promise<void> {
		const controlElement = this.controlElements.get( `${deviceId}-onoff` );
		
		try {
			if ( controlElement ) {
				controlElement.classList.add( 'control-item--loading' );
			}

			const device = this.deviceMap.get( deviceId );
			if ( device ) {
				await device.setCapabilityValue( 'onoff', value );
			}
			
			if ( controlElement ) {
				controlElement.classList.remove( 'control-item--loading' );
				controlElement.classList.toggle( 'control-item--active', value );
			}
		} catch ( error ) {
			console.error( `Failed to update toggle for device ${deviceId}:`, error );
			
			if ( controlElement ) {
				controlElement.classList.remove( 'control-item--loading' );
				controlElement.classList.add( 'control-item--error' );
				
				// Revert the switch state
				const switchElement = controlElement.querySelector( 'sl-switch' ) as any;
				if ( switchElement ) {
					switchElement.checked = !value;
				}
				
				// Reset error state after 2 seconds
				setTimeout( () => {
					if ( controlElement ) {
						controlElement.classList.remove( 'control-item--error' );
					}
				}, 2000 );
			}
		}
	}

	private async updateSliderDevice( deviceId: string, value: number ): Promise<void> {
		const controlElement = this.controlElements.get( `${deviceId}-dim` );
		
		try {
			if ( controlElement ) {
				controlElement.classList.add( 'control-item--loading' );
			}

			const device = this.deviceMap.get( deviceId );
			if ( device ) {
				// Convert 0-100 range back to 0-1 for Homey API
				const dimValue = value / 100;
				await device.setCapabilityValue( 'dim', dimValue );
				
				// Also update onoff based on dim value
				const onoffValue = dimValue > 0;
				await device.setCapabilityValue( 'onoff', onoffValue );
			}
			
			if ( controlElement ) {
				controlElement.classList.remove( 'control-item--loading' );
				controlElement.classList.toggle( 'control-item--active', value > 0 );
			}
		} catch ( error ) {
			console.error( `Failed to update dimmer for device ${deviceId}:`, error );
			
			if ( controlElement ) {
				controlElement.classList.remove( 'control-item--loading' );
				controlElement.classList.add( 'control-item--error' );
				
				// Reset error state after 2 seconds
				setTimeout( () => {
					if ( controlElement ) {
						controlElement.classList.remove( 'control-item--error' );
					}
				}, 2000 );
			}
		}
	}

	// Implement abstract methods from BaseTile
	public render(): void {
		// Clear existing content
		this.element.innerHTML = '';
		
		// Create tile header
		const header = document.createElement( 'div' );
		header.className = 'appliances-tile__header';
		
		const title = document.createElement( 'h2' );
		title.className = 'appliances-tile__title';
		title.textContent = this.config.name || 'Appliances';
		
		const subtitle = document.createElement( 'p' );
		subtitle.className = 'appliances-tile__subtitle';
		subtitle.textContent = `${this.nonDimmableDevices.length + this.dimmableDevices.length} devices`;
		
		header.appendChild( title );
		header.appendChild( subtitle );

		// Create columns container
		const columnsContainer = document.createElement( 'div' );
		columnsContainer.className = 'appliances-tile__columns';
		columnsContainer.appendChild( this.leftColumn );
		columnsContainer.appendChild( this.rightColumn );

		// Add everything to controls container
		this.controlsContainer.appendChild( header );
		this.controlsContainer.appendChild( columnsContainer );

		// Add to tile element
		this.element.appendChild( this.controlsContainer );
		this.element.className = 'tile appliances-tile appliances-tile--shoelace';
	}

	public update( newValue: any, capabilityId: string, deviceId?: string ): void {
		if ( !deviceId ) return;

		console.log( `🔄 AppliancesTileShoelace update: ${deviceId}:${capabilityId} = ${newValue}` );

		// Update device state in our maps
		const device = this.deviceMap.get( deviceId );
		if ( device && device.capabilitiesObj && device.capabilitiesObj[capabilityId] ) {
			device.capabilitiesObj[capabilityId].value = newValue;
		}

		// Update UI based on capability type
		if ( capabilityId === 'onoff' ) {
			this.updateShoelaceToggleUI( deviceId, newValue );
		} else if ( capabilityId === 'dim' ) {
			this.updateShoelaceSliderUI( deviceId, newValue );
		}
	}

	private updateShoelaceToggleUI( deviceId: string, value: boolean ): void {
		const controlKey = `${deviceId}-onoff`;
		const controlElement = this.controlElements.get( controlKey );
		console.log( `🔄 updateShoelaceToggleUI: ${deviceId} = ${value}` );
		
		if ( controlElement ) {
			const switchElement = controlElement.querySelector( 'sl-switch' ) as any;
			if ( switchElement ) {
				switchElement.checked = value;
			}
			controlElement.classList.toggle( 'control-item--active', value );
		} else {
			console.warn( `Control element not found for key: ${controlKey}` );
		}
	}

	private updateShoelaceSliderUI( deviceId: string, value: number ): void {
		const controlKey = `${deviceId}-dim`;
		const controlElement = this.controlElements.get( controlKey );
		console.log( `🔄 updateShoelaceSliderUI: ${deviceId} = ${value}` );
		
		if ( controlElement ) {
			const rangeElement = controlElement.querySelector( 'sl-range' ) as any;
			if ( rangeElement ) {
				rangeElement.value = Math.round( value * 100 );
			}
			
			const device = this.deviceMap.get( deviceId );
			const isOn = device?.capabilitiesObj?.onoff?.value ?? false;
			controlElement.classList.toggle( 'control-item--active', isOn && value > 0 );
		} else {
			console.warn( `Control element not found for key: ${controlKey}` );
		}
	}

	public getElement(): HTMLElement {
		return this.element;
	}

	// Utility function for debouncing
	private debounce<T extends ( ...args: any[] ) => any>( func: T, wait: number ): T {
		let timeout: NodeJS.Timeout;
		return ( ( ...args: any[] ) => {
			clearTimeout( timeout );
			timeout = setTimeout( () => func.apply( this, args ), wait );
		} ) as T;
	}
}
