import { HomeyDevice, Tile, TileType, TileConfigByType, createTileConfig, isTileOfType } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import { BaseTile } from './BaseTile';
import { SliderTile } from './SliderTile';
import { SwitchTile } from './SwitchTile';
import { SensorTile } from './SensorTile';
import { ButtonTile } from './ButtonTile';

/**
 * Type-safe tile factory with automatic type inference
 */
export class TileFactory {
	/**
	 * Create a tile instance with full type safety
	 * TypeScript automatically infers the correct tile class based on config.type
	 */
	static createTile(
		tileId: string,
		config: Tile,
		device: HomeyDevice | null,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	): BaseTile {
		// Type guards automatically narrow the config type
		if ( isTileOfType( config, 'SLIDER' ) ) {
			// config is now SliderTile - TypeScript knows all properties
			return new SliderTile( tileId, device, config, element, homeyApi );
		}
		
		if ( isTileOfType( config, 'SWITCH' ) ) {
			// config is now SwitchTile
			return new SwitchTile( tileId, device, config, element, homeyApi );
		}
		
		if ( isTileOfType( config, 'SENSOR' ) ) {
			// config is now SensorTile
			return new SensorTile( tileId, device, config, element, homeyApi );
		}
		
		if ( isTileOfType( config, 'BUTTON' ) ) {
			// config is now ButtonTile
			return new ButtonTile( tileId, device, config, element, homeyApi );
		}
		
		// Add more tile types here...
		
		throw new Error( `Unsupported tile type: ${config.type}` );
	}
	
	/**
	 * Create a type-safe tile configuration
	 * Usage: TileFactory.createConfig('SLIDER', { ... slider-specific props })
	 */
	static createConfig<T extends TileType>( 
		type: T, 
		config: Omit<TileConfigByType<T>, 'type'>
	): TileConfigByType<T> {
		return createTileConfig( type, config );
	}
	
	/**
	 * Validate tile configuration with type-specific validation
	 */
	static validateConfig( config: Tile ): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];
		
		// Common validation
		if ( !config.position || config.position.length !== 2 ) {
			errors.push( 'Invalid position - must be [x, y] coordinates' );
		}
		
		if ( config.width <= 0 || config.height <= 0 ) {
			errors.push( 'Width and height must be positive numbers' );
		}
		
		// Type-specific validation using type guards
		if ( isTileOfType( config, 'SLIDER' ) ) {
			// TypeScript knows this is SliderTile
			if ( config.minValue >= config.maxValue ) {
				errors.push( 'Slider minValue must be less than maxValue' );
			}
			if ( config.step <= 0 ) {
				errors.push( 'Slider step must be positive' );
			}
			if ( !config.id || !config.capabilityID ) {
				errors.push( 'Slider tiles require device id and capabilityID' );
			}
			if ( ![ 'horizontal', 'vertical', ].includes( config.orientation ) ) {
				errors.push( 'Slider orientation must be horizontal or vertical' );
			}
		}
		
		if ( isTileOfType( config, 'SWITCH' ) ) {
			// TypeScript knows this is SwitchTile
			if ( !config.id || !config.capabilityID ) {
				errors.push( 'Switch tiles require device id and capabilityID' );
			}
		}
		
		if ( isTileOfType( config, 'SENSOR' ) ) {
			// TypeScript knows this is SensorTile
			if ( !config.id || !config.capabilityID ) {
				errors.push( 'Sensor tiles require device id and capabilityID' );
			}
			if ( !config.unit ) {
				errors.push( 'Sensor tiles require a unit' );
			}
		}
		
		if ( isTileOfType( config, 'BUTTON' ) ) {
			// TypeScript knows this is ButtonTile
			if ( !config.id ) {
				errors.push( 'Button tiles require device id' );
			}
			if ( !config.capabilityID && !config.flowID ) {
				errors.push( 'Button tiles require either capabilityID or flowID' );
			}
		}
		
		return {
			isValid: errors.length === 0,
			errors,
		};
	}
	
	/**
	 * Get default properties for a tile type
	 */
	static getDefaults<T extends TileType>( type: T ): Partial<TileConfigByType<T>> {
		const commonDefaults = {
			width: 1,
			height: 1,
		};
		
		switch ( type ) {
			case 'SLIDER':
				return {
					...commonDefaults,
					orientation: 'horizontal',
					minValue: 0,
					maxValue: 100,
					step: 1,
					showValue: true,
				} as Partial<TileConfigByType<T>>;
			
			case 'SWITCH':
				return {
					...commonDefaults,
					clickable: true,
				} as Partial<TileConfigByType<T>>;
			
			case 'SENSOR':
				return {
					...commonDefaults,
					unit: '',
				} as Partial<TileConfigByType<T>>;
			
			case 'BUTTON':
				return {
					...commonDefaults,
				} as Partial<TileConfigByType<T>>;
			
			case 'VIRTUAL':
				return {
					...commonDefaults,
				} as Partial<TileConfigByType<T>>;
			
			default:
				return commonDefaults as Partial<TileConfigByType<T>>;
		}
	}
	
	/**
	 * Create a tile configuration with defaults merged in
	 */
	static createConfigWithDefaults<T extends TileType>( 
		type: T, 
		config: Partial<Omit<TileConfigByType<T>, 'type'>>
	): TileConfigByType<T> {
		const defaults = this.getDefaults( type );
		const mergedConfig = { ...defaults, ...config, } as Omit<TileConfigByType<T>, 'type'>;
		return createTileConfig( type, mergedConfig );
	}
	
	/**
	 * Extract device IDs from a tile configuration
	 */
	static getRequiredDevices( configs: Tile[] ): string[] {
		const deviceIds = new Set<string>();
		
		configs.forEach( config => {
			if ( 'id' in config && config.id ) {
				deviceIds.add( config.id );
			}
			
			// Handle popup tiles that contain other tiles
			if ( isTileOfType( config, 'POPUP' ) && config.items ) {
				const nestedDevices = this.getRequiredDevices( config.items );
				nestedDevices.forEach( id => deviceIds.add( id ) );
			}
		} );
		
		return Array.from( deviceIds );
	}
	
	/**
	 * Group tiles by type for batch processing
	 */
	static groupTilesByType( configs: Tile[] ): Record<TileType, Tile[]> {
		const groups = {} as Record<TileType, Tile[]>;
		
		configs.forEach( config => {
			if ( !groups[config.type] ) {
				groups[config.type] = [];
			}
			groups[config.type].push( config );
		} );
		
		return groups;
	}
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Example 1: Type-safe tile creation
const sliderConfig = TileFactory.createConfig('SLIDER', {
  position: [0, 0],
  width: 2,
  height: 1, 
  id: 'dimmer-123',
  capabilityID: 'dim',
  orientation: 'horizontal',
  minValue: 0,
  maxValue: 100,
  step: 5,
  name: 'Living Room Dimmer',
  unit: '%'
});

// Example 2: Config with defaults
const switchConfig = TileFactory.createConfigWithDefaults('SWITCH', {
  position: [2, 0],
  id: 'light-456', 
  capabilityID: 'onoff',
  name: 'Kitchen Light'
  // width: 1, height: 1, clickable: true are added automatically
});

// Example 3: Validation  
const validation = TileFactory.validateConfig(sliderConfig);
if (!validation.isValid) {
  console.error('Invalid config:', validation.errors);
}

// Example 4: Create tile instance
const tileElement = document.createElement('div');
const homeyDevice = await homeyClient.getDevice('dimmer-123');
const tile = TileFactory.createTile('tile-1', sliderConfig, homeyDevice, tileElement, homeyApi);

// Example 5: Batch operations
const configs = [sliderConfig, switchConfig];
const requiredDevices = TileFactory.getRequiredDevices(configs);  // ['dimmer-123', 'light-456']
const groupedTiles = TileFactory.groupTilesByType(configs);       // { SLIDER: [...], SWITCH: [...] }
*/
