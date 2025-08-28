import { BaseTile } from './BaseTile.js';
import { AppliancesTileConfig as AppliancesTileConfig, HomeyDevice } from '../types.js';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import { TileHMRHelper } from '../utils/TileHMR.js';

interface ApplianceDevice {
	id: string;
	device: HomeyDevice;
	capabilities: string[];
}

export class AppliancesTile extends BaseTile {
	private tileContainer: HTMLElement;
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
		this.tileContainer = this.createTileContainer();
		this.leftColumn = this.createColumn( 'left' );
		this.rightColumn = this.createColumn( 'right' );
		
		this.initializeApplianceDevices();
		this.createDeviceControls();
		
		// Setup event listeners for external updates
		this.setupEventListeners().catch( error => {
			console.error( `Failed to setup event listeners for AppliancesTileShoelace ${this.tileId}:`, error );
		} );
	}

	private createTileContainer(): HTMLElement {
		const container = document.createElement( 'div' );
		container.className = 'tile-container';
		return container;
	}

	private createColumn( side: 'left' | 'right' ): HTMLElement {
		const column = document.createElement( 'div' );
		column.className = `tile-column appliances-tile-column --${side}`;
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
			this.controlElements.set( controlKey, controlElement[1] );

			this.leftColumn.appendChild( controlElement[0] );
			this.leftColumn.appendChild( controlElement[1] );

			console.log( `📝 Created Shoelace toggle control for ${appliance.device.name}` );
		} );

		// Create controls for dimmable devices (right column)
		this.dimmableDevices.forEach( appliance => {
			const controlElement = this.createShoelaceDimmerControl( appliance );
			const controlKey = `${appliance.id}-dim`;
			this.controlElements.set( controlKey, controlElement[1] );

			this.rightColumn.appendChild( controlElement[0] );
			this.rightColumn.appendChild( controlElement[1] );
			this.rightColumn.appendChild( controlElement[2] );

			console.log( `📝 Created Shoelace dimmer control for ${appliance.device.name}` );
		} );

		console.log( `📋 Total Shoelace control elements created: ${this.controlElements.size}` );
	}

	private createShoelaceToggleControl( appliance: ApplianceDevice ): HTMLElement[] {
		const { device, id, } = appliance;
		const isOnline = true; // HomeyDevice doesn't have available property - assume online
		const isOn = device.capabilitiesObj?.onoff?.value ?? false;

		// Create Shoelace switch
		const switchElement = document.createElement( 'sl-switch' );
		switchElement.checked = isOn;
		switchElement.disabled = !isOnline;
		switchElement.addEventListener( 'sl-change', ( e: any ) => {
			this.debouncedToggleUpdate( id, e.target.checked );
		} );

		const title = document.createElement( 'span' )
		title.className = 'control-item-title';
		title.textContent = device.name;

		return [
			title,
			switchElement,
		];
	}

	private createShoelaceDimmerControl( appliance: ApplianceDevice ): HTMLElement[] {
		const { device, id, } = appliance;
		const dimValue = device.capabilitiesObj?.dim?.value ?? 0;
		
		// Convert 0-1 range to 0-100 for the slider
		const sliderValue = Math.round( dimValue * 100 );

		// Create Shoelace range slider
		const rangeElement = document.createElement( 'sl-range' );
		rangeElement.min = 0;
		rangeElement.max = 100;
		rangeElement.value = sliderValue;
		rangeElement.tooltip = "none";
		rangeElement.step = 1;
		
		// Add prefix icon and suffix text
		// const prefixIcon = document.createElement( 'sl-icon' );
		// prefixIcon.setAttribute( 'name', 'lightbulb' );
		// prefixIcon.setAttribute( 'slot', 'prefix' );
		// rangeElement.appendChild( prefixIcon );

		const suffixText = document.createElement( 'span' );
		suffixText.setAttribute( 'slot', 'suffix' );
		suffixText.textContent = '%';
		rangeElement.appendChild( suffixText );

		// Create title element
		const title = document.createElement( 'span' )
		title.className = 'control-item-title';
		title.textContent = device.name;

		// Create percentage label
		const percentageLabel = document.createElement( 'span' );
		percentageLabel.className = 'control-item-percentage';
		percentageLabel.textContent = sliderValue === 0 ? 'OFF' : `${sliderValue}%`;

		// Add event listenerers
		rangeElement.addEventListener( 'sl-input', ( e: any ) => {
			percentageLabel.textContent = e.target.value === 0 ? 'OFF' : `${e.target.value}%`;
		} );

		rangeElement.addEventListener( 'sl-change', ( e: any ) => {
			this.debouncedSliderUpdate( id, e.target.value, percentageLabel );
		} );

		return [
			title,
			rangeElement,
			percentageLabel,
		];
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
				const switchElement = controlElement.querySelector( 'sl-switch' );
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

	private async updateSliderDevice( deviceId: string, value: number, label?: HTMLElement ): Promise<void> {
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

			if ( label ) {
				label.textContent = `${value}%`;
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
		header.className = 'tile-header';
		
		const title = document.createElement( 'span' );
		title.className = 'tile-title';
		title.textContent = this.config.name || 'Appliances 🏠';
		
		const subtitle = document.createElement( 'p' );
		subtitle.className = 'tile-header-side';
		subtitle.textContent = `${this.nonDimmableDevices.length + this.dimmableDevices.length} devices`;
		
		header.appendChild( title );
		header.appendChild( subtitle );

		// Create columns container
		const columnsContainer = document.createElement( 'div' );
		columnsContainer.className = 'appliances-tile-columns tile-columns';
		columnsContainer.appendChild( this.leftColumn );
		columnsContainer.appendChild( this.rightColumn );

		// Add everything to controls container
		this.tileContainer.appendChild( header );
		this.tileContainer.appendChild( columnsContainer );

		// Add to tile element
		this.element.appendChild( this.tileContainer );
		this.element.className = 'tile appliances-tile';
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
			const switchElement = controlElement.querySelector( 'sl-switch' );
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
			const rangeElement = controlElement.querySelector( 'sl-range' );
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

// Hot Module Replacement (HMR) support
if ( import.meta.hot ) {
	import.meta.hot.accept( TileHMRHelper.create( AppliancesTile, 'AppliancesTile' ) );
}