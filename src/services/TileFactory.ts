import { Tile, TileType, TileConfigByType, createTileConfig, isTileOfType, getTileDeviceIds } from '../types';


/**
 * Type-safe tile factory with automatic type inference
 */
export class TileFactory {	
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
			// Check for device configuration (legacy or new)
			if ( !config.id && !config.devices ) {
				errors.push( 'Slider tiles require device configuration (id or devices)' );
			}
			if ( !config.capabilityID && !config.devices ) {
				errors.push( 'Slider tiles require capability configuration (capabilityID or devices)' );
			}
			if ( ![ 'horizontal', 'vertical', ].includes( config.orientation ) ) {
				errors.push( 'Slider orientation must be horizontal or vertical' );
			}
		}
		
		if ( isTileOfType( config, 'SWITCH' ) ) {
			// TypeScript knows this is SwitchTile
			if ( !config.id && !config.devices ) {
				errors.push( 'Switch tiles require device configuration (id or devices)' );
			}
			if ( !config.capabilityID && !config.devices ) {
				errors.push( 'Switch tiles require capability configuration (capabilityID or devices)' );
			}
		}
		
		if ( isTileOfType( config, 'SENSOR' ) ) {
			// TypeScript knows this is SensorTile
			if ( !config.id && !config.devices ) {
				errors.push( 'Sensor tiles require device configuration (id or devices)' );
			}
			if ( !config.capabilityID && !config.devices ) {
				errors.push( 'Sensor tiles require capability configuration (capabilityID or devices)' );
			}
			if ( !config.unit ) {
				errors.push( 'Sensor tiles require a unit' );
			}
		}
		
		if ( isTileOfType( config, 'BUTTON' ) ) {
			// TypeScript knows this is ButtonTile
			if ( !config.id && !config.devices ) {
				errors.push( 'Button tiles require device configuration (id or devices)' );
			}
			if ( !config.capabilityID && !config.flowID && !config.devices ) {
				errors.push( 'Button tiles require either capabilityID/flowID or devices configuration' );
			}
		}
		
		if ( isTileOfType( config, 'APPLIANCES' ) ) {
			// TypeScript knows this is AppliancesTile
			if ( !config.id && !config.devices ) {
				errors.push( 'Appliances tiles require device configuration (id or devices)' );
			}
			if ( config.maxRows && ![ 1, 2, ].includes( config.maxRows ) ) {
				errors.push( 'Appliances tiles maxRows must be 1 or 2' );
			}
			if ( config.iconSize && ( config.iconSize < 12 || config.iconSize > 48 ) ) {
				errors.push( 'Appliances tiles iconSize must be between 12 and 48' );
			}
		}
		
		if ( isTileOfType( config, 'ENERGY_PRICE' ) ) {
			// TypeScript knows this is EnergyPriceTile
			if ( ![ 'NO1', 'NO2', 'NO3', 'NO4', 'NO5', ].includes( config.priceArea ) ) {
				errors.push( 'Energy price tiles require a valid Norwegian price area (NO1-NO5)' );
			}
			if ( config.refreshInterval && ( config.refreshInterval < 5 || config.refreshInterval > 60 ) ) {
				errors.push( 'Energy price tiles refresh interval must be between 5 and 60 minutes' );
			}
			if ( config.tariffCost && config.tariffCost < 0 ) {
				errors.push( 'Energy price tiles tariff cost cannot be negative' );
			}
			if ( config.taxPercentage && ( config.taxPercentage < 0 || config.taxPercentage > 50 ) ) {
				errors.push( 'Energy price tiles tax percentage must be between 0 and 50%' );
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
			
			case 'APPLIANCES':
				return {
					...commonDefaults,
					width: 3,
					height: 2,
					maxRows: 2,
					showNames: true,
					iconSize: 24,
					itemSpacing: 8,
				} as Partial<TileConfigByType<T>>;
			
			case 'ENERGY_PRICE':
				return {
					...commonDefaults,
					width: 3,
					height: 2,
					priceArea: 'NO1',
					refreshInterval: 15,
					showCurrentPrice: true,
					tariffCost: 0,
					taxPercentage: 25,
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
			const tileDeviceIds = getTileDeviceIds( config );
			tileDeviceIds.forEach( id => deviceIds.add( id ) );
			
			// TODO: Handle popup tiles that contain other tiles when popup types are updated
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

// Example 4: Batch operations
const configs = [sliderConfig, switchConfig];
const requiredDevices = TileFactory.getRequiredDevices(configs);  // ['dimmer-123', 'light-456']
const groupedTiles = TileFactory.groupTilesByType(configs);       // { SLIDER: [...], SWITCH: [...] }
*/
