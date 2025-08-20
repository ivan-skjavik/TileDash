import { BaseTile } from './BaseTile';
import { HomeyDevice, ButtonTile as ButtonTileConfig } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class ButtonTile extends BaseTile {
	private isPressed: boolean = false;
	private buttonConfig: ButtonTileConfig;

	constructor(
		tileId: string,
		device: HomeyDevice | null,
		config: ButtonTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, device, config, element, homeyApi );
		this.buttonConfig = config;
	}

	protected getCapabilityID(): string | undefined {
		return this.buttonConfig.capabilityID;
	}

	render(): void {
		this.element.classList.add( 'button-tile' );
		this.element.innerHTML = ''; // Clear existing content

		const config = this.buttonConfig;

		// Add icon
		if ( config.icon ) {
			const iconElement = this.createIcon( config.icon, 32 );
			this.element.appendChild( iconElement );
		}

		// Add name
		if ( config.name ) {
			const nameElement = this.createNameElement( config.name );
			this.element.appendChild( nameElement );
		}

		// Button-specific styling
		this.element.style.cursor = 'pointer';
		this.element.style.userSelect = 'none';
		this.element.style.transition = 'all 0.1s ease';

		// Add hover effects
		this.setupHoverEffects();
    
		// Add click handler
		this.setupClickHandler();

		// Setup event listeners (buttons might have state to monitor)
		this.setupEventListeners().catch( error => {
			console.error( `Failed to setup event listeners for ButtonTile ${this.tileId}:`, error );
		} );

		console.log( `🔲 Rendered ButtonTile: ${this.tileId}` );
	}

	private setupHoverEffects(): void {
		this.element.addEventListener( 'mouseenter', () => {
			if ( !this.isPressed ) {
				this.element.style.transform = 'translateY(-2px)';
				this.element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
			}
		} );

		this.element.addEventListener( 'mouseleave', () => {
			if ( !this.isPressed ) {
				this.element.style.transform = 'translateY(0)';
				this.element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
			}
		} );
	}

	private setupClickHandler(): void {
		this.element.addEventListener( 'mousedown', () => {
			this.isPressed = true;
			this.element.style.transform = 'translateY(0)';
			this.element.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
		} );

		this.element.addEventListener( 'mouseup', () => {
			this.isPressed = false;
			this.element.style.transform = 'translateY(-2px)';
			this.element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
		} );

		this.element.addEventListener( 'click', async ( e ) => {
			e.preventDefault();
			e.stopPropagation();
      
			await this.handleButtonPress();
		} );
	}

	private async handleButtonPress(): Promise<void> {
		if ( !this.device ) {
			console.warn( 'No device associated with button tile' );
			return;
		}

		const config = this.buttonConfig;

		try {
			console.log( `🔲 Button pressed: ${this.device.name} ${config.capabilityID || 'trigger'}` );
      
			if ( config.capabilityID ) {
				// Button with capability (e.g., toggle or set value)
				const capability = this.getCapability();
				if ( capability && capability.setable ) {
					// TODO this does not toggle correctly
					const buttonValue = config.buttonValue !== undefined ? config.buttonValue : false;
					await this.homeyApi.devices.setCapabilityValue( {
						deviceId: this.device.id,
						capabilityId: config.capabilityID,
						value: buttonValue,
					} );
				}
			} else if ( config.flowID ) {
				// Button triggers a flow
				await this.homeyApi.flow.triggerFlow( { id: config.flowID, } );
			}

			// Visual feedback
			this.showButtonFeedback();
      
		} catch ( error ) {
			console.error( 'Error handling button press:', error );
			this.showErrorFeedback();
		}
	}

	private showButtonFeedback(): void {
		const originalBg = this.element.style.backgroundColor;
		this.element.style.backgroundColor = 'var(--tile-success-background, #4CAF50)';
    
		setTimeout( () => {
			this.element.style.backgroundColor = originalBg;
		}, 300 );
	}

	private showErrorFeedback(): void {
		const originalBg = this.element.style.backgroundColor;
		this.element.style.backgroundColor = 'var(--tile-error-background, #f44336)';
    
		setTimeout( () => {
			this.element.style.backgroundColor = originalBg;
		}, 500 );
	}

	update( newValue: any, capability: string ): void {
		const capabilityID = this.getCapabilityID();
		if ( capability !== capabilityID ) return;

		console.log( `🔄 Updating ButtonTile ${this.tileId} with value:`, newValue );
    
		// Button tiles might not need visual updates for state changes
		// but we could add visual indicators if needed
		// For example, change button color based on state
		this.updateButtonState( newValue );
	}

	private updateButtonState( value: any ): void {
		// Optional: Update button appearance based on state
		if ( typeof value === 'boolean' ) {
			if ( value ) {
				this.element.style.backgroundColor = 'var(--tile-active-background, #4CAF50)';
				this.element.style.color = 'white';
			} else {
				this.element.style.backgroundColor = 'var(--tile-background, #fff)';
				this.element.style.color = 'var(--text-color, #333)';
			}
		}
	}
}
