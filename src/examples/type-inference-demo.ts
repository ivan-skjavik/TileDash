/**
 * Demo: TypeScript Type Inference for Tile Configurations
 * This file demonstrates how the enhanced type system works
 */

import { 
	Tile, 
	TileConfigByType, 
	TileType, 
	createTileConfig, 
	isTileOfType, 
	isDeviceTile,
	SliderTile,
	SwitchTile,
	VirtualTile,
} from '../types';

// ============================================================================
// 1. Type-Safe Tile Creation
// ============================================================================

// ✅ TypeScript knows this is a SliderTile and enforces all required properties
const sliderConfig = createTileConfig( 'SLIDER', {
	position: [ 0, 0, ],
	width: 2,
	height: 1,
	id: 'device-123',
	capabilityID: 'dim',
	orientation: 'horizontal',
	minValue: 0,
	maxValue: 100,
	step: 1,
	name: 'Living Room Dimmer',
	unit: '%',
	showValue: true,
} );

// ✅ TypeScript knows this is a SwitchTile
const switchConfig = createTileConfig( 'SWITCH', {
	position: [ 2, 0, ],
	width: 1,
	height: 1,
	id: 'device-456',
	capabilityID: 'onoff',
	name: 'Kitchen Light',
	icons: {
		on: 'mdi-lightbulb-on',
		off: 'mdi-lightbulb-off',
	},
	clickable: true,
} );

// ✅ TypeScript knows this is a VirtualTile (no device properties required)
const virtualConfig = createTileConfig( 'VIRTUAL', {
	position: [ 3, 0, ],
	width: 1,
	height: 1,
	name: 'Spacer',
} );

// ❌ This would cause a TypeScript error - missing required 'orientation' property
// const invalidSlider = createTileConfig('SLIDER', {
//   position: [0, 1],
//   width: 2,
//   height: 1,
//   id: 'device-789',
//   capabilityID: 'dim'
//   // Missing: orientation, minValue, maxValue, step
// });

// ============================================================================
// 2. Type Inference Based on Type Parameter
// ============================================================================

// Function that demonstrates type inference
function processTileConfig<T extends TileType>( type: T, config: TileConfigByType<T> ): void {
	console.log( `Processing ${type} tile:`, config );
	
	// TypeScript now knows the exact type of config based on the type parameter
	if ( type === 'SLIDER' ) {
		// config is narrowed to SliderTile
		const sliderTile = config as SliderTile;
		console.log( `Slider range: ${sliderTile.minValue} - ${sliderTile.maxValue}` );
	}
}

// Usage - TypeScript infers the types automatically
processTileConfig( 'SLIDER', sliderConfig ); // ✅ Type-safe
processTileConfig( 'SWITCH', switchConfig ); // ✅ Type-safe
processTileConfig( 'VIRTUAL', virtualConfig ); // ✅ Type-safe

// ============================================================================
// 3. Runtime Type Guards with Type Narrowing
// ============================================================================

function handleTileConfig( tile: Tile ): void {
	console.log( `Handling tile: ${tile.type}` );
	
	// Type guard narrows the type automatically
	if ( isTileOfType( tile, 'SLIDER' ) ) {
		// tile is now SliderTile - TypeScript knows all properties
		console.log( `Slider orientation: ${tile.orientation}` );
		console.log( `Value range: ${tile.minValue} to ${tile.maxValue}` );
		console.log( `Step size: ${tile.step}` );
		console.log( `Unit: ${tile.unit || 'no unit'}` );
	} else if ( isTileOfType( tile, 'SWITCH' ) ) {
		// tile is now SwitchTile
		console.log( `Switch device: ${tile.id}` );
		console.log( `Capability: ${tile.capabilityID}` );
		console.log( `Clickable: ${tile.clickable || false}` );
		if ( tile.icons ) {
			console.log( `Icons: ${tile.icons.on} / ${tile.icons.off}` );
		}
	} else if ( isTileOfType( tile, 'VIRTUAL' ) ) {
		// tile is now VirtualTile  
		console.log( `Virtual tile: ${tile.name || 'unnamed'}` );
		console.log( `Size: ${tile.width}x${tile.height}` );
	}
	
	// Generic device tile handling
	if ( isDeviceTile( tile ) ) {
		console.log( `Device tile - ID: ${tile.id}, Capability: ${tile.capabilityID}` );
	}
}

// Test the type guards
handleTileConfig( sliderConfig );
handleTileConfig( switchConfig );
handleTileConfig( virtualConfig );

// ============================================================================
// 4. Tile Factory with Type Inference
// ============================================================================

class TypeSafeTileFactory {
	/**
	 * Create a tile configuration with full type safety
	 */
	static create<T extends TileType>( 
		type: T, 
		config: Omit<TileConfigByType<T>, 'type'>
	): TileConfigByType<T> {
		return createTileConfig( type, config );
	}
	
	/**
	 * Validate tile configuration at runtime
	 */
	static validate( tile: Tile ): boolean {
		// Common validation
		if ( !tile.position || tile.width <= 0 || tile.height <= 0 ) {
			return false;
		}
		
		// Type-specific validation
		if ( isTileOfType( tile, 'SLIDER' ) ) {
			return tile.minValue < tile.maxValue && tile.step > 0;
		}
		
		if ( isTileOfType( tile, 'SWITCH' ) ) {
			return Boolean( tile.id && tile.capabilityID );
		}
		
		if ( isTileOfType( tile, 'SENSOR' ) ) {
			return Boolean( tile.id && tile.capabilityID && tile.unit );
		}
		
		return true;
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
			
			default:
				return commonDefaults as Partial<TileConfigByType<T>>;
		}
	}
}

// Usage examples
const factorySlider = TypeSafeTileFactory.create( 'SLIDER', {
	position: [ 0, 2, ],
	id: 'dimmer-001',
	capabilityID: 'dim',
	...TypeSafeTileFactory.getDefaults( 'SLIDER' ), // Merges default values
	orientation: 'vertical', // Override defaults
	unit: '%',
} );

console.log( 'Factory created slider:', factorySlider );
console.log( 'Validation result:', TypeSafeTileFactory.validate( factorySlider ) );

// ============================================================================
// 5. Advanced Type Utilities
// ============================================================================

// Extract all device tile types
type DeviceTileTypes = {
	[K in TileType]: TileConfigByType<K> extends { id: string; capabilityID: string } ? K : never
}[TileType];

// This resolves to: 'SWITCH' | 'BINARY_SENSOR' | 'SENSOR' | 'SLIDER' | 'HEIMDALL' | ...

// Extract all virtual tile types  
type VirtualTileTypes = {
	[K in TileType]: TileConfigByType<K> extends { id: string } ? never : K
}[TileType];

// This resolves to: 'VIRTUAL' | 'IMAGE'

// Helper to get required properties for a tile type
type RequiredTileProps<T extends TileType> = {
	[K in keyof TileConfigByType<T>]-?: TileConfigByType<T>[K] extends undefined ? never : K
}[keyof TileConfigByType<T>];

// Usage: RequiredTileProps<'SLIDER'> = 'type' | 'position' | 'width' | 'height' | 'id' | 'capabilityID' | 'orientation' | 'minValue' | 'maxValue' | 'step'

export {
	sliderConfig,
	switchConfig,
	virtualConfig,
	processTileConfig,
	handleTileConfig,
	TypeSafeTileFactory,
};

// ============================================================================
// Demo Results
// ============================================================================

/* 
This type system provides:

1. ✅ **Type Safety**: TypeScript catches missing/invalid properties at compile time
2. ✅ **IntelliSense**: Full autocomplete for tile-specific properties  
3. ✅ **Type Inference**: Automatic type narrowing based on 'type' parameter
4. ✅ **Runtime Safety**: Type guards for safe property access
5. ✅ **Factory Pattern**: Type-safe tile creation with defaults
6. ✅ **Validation**: Built-in validation with type-specific rules

Usage Benefits:
- No more typos in tile configuration
- Immediate feedback on missing required properties  
- Full IntelliSense support in IDE
- Runtime type checking with type guards
- Extensible system for new tile types

Example IDE Experience:
When you type `createTileConfig('SLIDER', {`, your IDE will show:
- ✅ Required: position, width, height, id, capabilityID, orientation, minValue, maxValue, step  
- ✅ Optional: name, icon, showValue, unit
- ❌ Invalid properties are highlighted immediately
*/
