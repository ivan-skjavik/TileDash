import { BaseTile } from './BaseTile.js';
import { AppliancesTile as AppliancesTileConfig, HomeyDevice } from '../types.js';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import {
	createMaterialToggle,
	createMaterialSlider,
	createControlItem,
	createStatusIndicator,
	updateMaterialToggle,
	updateMaterialSlider,
	updateControlItemState,
	debounce,
	type MaterialToggleOptions,
	type MaterialSliderOptions,
	type ControlItemOptions,
} from '../utils/MaterialControls.js';

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
	
	// Debounced update functions
	private debouncedToggleUpdate = debounce( this.updateToggleDevice.bind( this ), 300 );
	private debouncedSliderUpdate = debounce( this.updateSliderDevice.bind( this ), 500 );

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
		// this.render();
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

			// Categorize based on the capability specified in tile config, not device capabilities
			if ( mapping.capabilityId === 'dim' ) {
				this.dimmableDevices.push( applianceDevice );
			} else if ( mapping.capabilityId === 'onoff' ) {
				this.nonDimmableDevices.push( applianceDevice );
			}
		}

		// Sort devices by name for consistent ordering
		this.nonDimmableDevices.sort( ( a, b ) => a.device.name.localeCompare( b.device.name ) );
		this.dimmableDevices.sort( ( a, b ) => a.device.name.localeCompare( b.device.name ) );
	}

	private createDeviceControls(): void {
		// Create controls for non-dimmable devices (left column)
		this.nonDimmableDevices.forEach( appliance => {
			const controlElement = this.createToggleControl( appliance );
			this.controlElements.set( `${appliance.id}-onoff`, controlElement );
			this.leftColumn.appendChild( controlElement );
		} );

		// Create controls for dimmable devices (right column)
		this.dimmableDevices.forEach( appliance => {
			const controlElement = this.createDimmerControl( appliance );
			this.controlElements.set( `${appliance.id}-dim`, controlElement );
			this.rightColumn.appendChild( controlElement );
		} );
	}

	private createToggleControl( appliance: ApplianceDevice ): HTMLElement {
		const { device, id, } = appliance;
		const isOnline = true; // HomeyDevice doesn't have available property - assume online
		const isOn = device.capabilitiesObj?.onoff?.value ?? false;

		// Create toggle switch
		const toggleOptions: MaterialToggleOptions = {
			id: `toggle-${id}`,
			checked: isOn,
			disabled: !isOnline,
			onChange: ( checked ) => this.debouncedToggleUpdate( id, checked ),
			ariaLabel: `Toggle ${device.name}`,
		};

		const toggle = createMaterialToggle( toggleOptions );
		
		// Create status indicator
		const statusIndicator = createStatusIndicator( isOnline );

		// Create control container with title and status
		const controlInfo = document.createElement( 'div' );
		controlInfo.style.display = 'flex';
		controlInfo.style.alignItems = 'center';
		controlInfo.appendChild( toggle );
		controlInfo.appendChild( statusIndicator );

		const controlOptions: ControlItemOptions = {
			title: device.name,
			subtitle: this.getDeviceSubtitle( device ),
			control: controlInfo,
			state: isOnline ? ( isOn ? 'active' : undefined ) : 'unavailable',
		};

		return createControlItem( controlOptions );
	}

	private createDimmerControl( appliance: ApplianceDevice ): HTMLElement {
		const { device, id, } = appliance;
		const isOnline = true; // HomeyDevice doesn't have available property - assume online
		const dimValue = device.capabilitiesObj?.dim?.value ?? 0;
		const isOn = device.capabilitiesObj?.onoff?.value ?? false;
		
		// Convert 0-1 range to 0-100 for the slider
		const sliderValue = Math.round( dimValue * 100 );

		// Create dimmer slider
		const sliderOptions: MaterialSliderOptions = {
			id: `slider-${id}`,
			value: sliderValue,
			min: 0,
			max: 100,
			step: 1,
			disabled: !isOnline,
			onChange: ( value ) => this.debouncedSliderUpdate( id, value ),
			showValue: true,
			unit: '%',
			ariaLabel: `Adjust brightness for ${device.name}`,
		};

		const slider = createMaterialSlider( sliderOptions );
		
		// Create status indicator
		const statusIndicator = createStatusIndicator( isOnline );

		// Create control container with slider and status
		const controlInfo = document.createElement( 'div' );
		controlInfo.style.display = 'flex';
		controlInfo.style.alignItems = 'center';
		controlInfo.style.gap = '12px';
		controlInfo.appendChild( slider );
		controlInfo.appendChild( statusIndicator );

		const controlOptions: ControlItemOptions = {
			title: device.name,
			subtitle: this.getDeviceSubtitle( device ),
			control: controlInfo,
			state: isOnline ? ( isOn && sliderValue > 0 ? 'active' : undefined ) : 'unavailable',
		};

		return createControlItem( controlOptions );
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
				updateControlItemState( controlElement, 'loading' );
			}

			const device = this.deviceMap.get( deviceId );
			if ( device ) {
				await device.setCapabilityValue( 'onoff', value );
			}
			
			if ( controlElement ) {
				updateControlItemState( controlElement, value ? 'active' : undefined );
			}
		} catch ( error ) {
			console.error( `Failed to update toggle for device ${deviceId}:`, error );
			
			if ( controlElement ) {
				updateControlItemState( controlElement, 'error' );
				// Revert the toggle state
				const toggle = controlElement.querySelector( '.material-toggle' ) as HTMLElement;
				if ( toggle ) {
					updateMaterialToggle( toggle, !value );
				}
				
				// Reset error state after 2 seconds
				setTimeout( () => {
					if ( controlElement ) {
						updateControlItemState( controlElement );
					}
				}, 2000 );
			}
		}
	}

	private async updateSliderDevice( deviceId: string, value: number ): Promise<void> {
		const controlElement = this.controlElements.get( `${deviceId}-dim` );
		
		try {
			if ( controlElement ) {
				updateControlItemState( controlElement, 'loading' );
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
				updateControlItemState( controlElement, value > 0 ? 'active' : undefined );
			}
		} catch ( error ) {
			console.error( `Failed to update dimmer for device ${deviceId}:`, error );
			
			if ( controlElement ) {
				updateControlItemState( controlElement, 'error' );
				
				// Reset error state after 2 seconds
				setTimeout( () => {
					if ( controlElement ) {
						updateControlItemState( controlElement );
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
		this.element.className = 'tile appliances-tile';
	}

	public update( newValue: any, capabilityId: string, deviceId?: string ): void {
		if ( !deviceId ) return;

		// Update device state in our maps
		const device = this.deviceMap.get( deviceId );
		if ( device && device.capabilitiesObj && device.capabilitiesObj[capabilityId] ) {
			device.capabilitiesObj[capabilityId].value = newValue;
		}

		// Update UI based on capability type
		if ( capabilityId === 'onoff' ) {
			this.updateToggleUI( deviceId, newValue );
		} else if ( capabilityId === 'dim' ) {
			this.updateSliderUI( deviceId, newValue );
		}
	}

	private updateToggleUI( deviceId: string, value: boolean ): void {
		const controlElement = this.controlElements.get( `${deviceId}-onoff` );
		if ( controlElement ) {
			const toggle = controlElement.querySelector( '.material-toggle' ) as HTMLElement;
			if ( toggle ) {
				updateMaterialToggle( toggle, value );
			}
			updateControlItemState( controlElement, value ? 'active' : undefined );
		}
	}

	private updateSliderUI( deviceId: string, value: number ): void {
		const controlElement = this.controlElements.get( `${deviceId}-dim` );
		if ( controlElement ) {
			const slider = controlElement.querySelector( '.material-slider' ) as HTMLElement;
			if ( slider ) {
				updateMaterialSlider( slider, Math.round( value * 100 ), '%' );
			}
			
			const device = this.deviceMap.get( deviceId );
			const isOn = device?.capabilitiesObj?.onoff?.value ?? false;
			updateControlItemState( controlElement, isOn && value > 0 ? 'active' : undefined );
		}
	}

	public getElement(): HTMLElement {
		return this.element;
	}
}
