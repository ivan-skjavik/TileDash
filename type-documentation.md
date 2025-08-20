# TileDash TypeScript Type System Documentation 📚

## Table of Contents
- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Basic Usage](#basic-usage)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The TileDash TypeScript type system provides **compile-time safety** and **automatic type inference** for tile configurations. It ensures that:

- ✅ **All required properties** are provided for each tile type
- ✅ **Invalid properties** are caught at compile time
- ✅ **Type-specific validation** runs automatically
- ✅ **IDE IntelliSense** shows only valid properties
- ✅ **Runtime type guards** enable safe property access

## Core Concepts

### Type Hierarchy

```typescript
// Base interface for all tiles
interface BaseTileData {
  position: [number, number];  // [x, y] coordinates
  name?: string;               // Display name
  width: number;               // Tile width in grid units
  height: number;              // Tile height in grid units
  icon?: string;               // Optional icon override
}

// Device-connected tiles extend base with device properties
interface DeviceTileData extends BaseTileData {
  id: string;                  // Homey device ID
  capabilityID: string;        // Device capability to control
}
```

### Tile Types

| Tile Type | Base Interface | Required Properties | Use Case |
|-----------|---------------|-------------------|----------|
| `VIRTUAL` | `BaseTileData` | position, width, height | Spacers, decorative elements |
| `SLIDER` | `DeviceTileData` | + orientation, minValue, maxValue, step | Dimmers, volume controls |
| `SWITCH` | `DeviceTileData` | (none additional) | Lights, switches |
| `SENSOR` | `DeviceTileData` | + unit | Temperature, humidity sensors |
| `BUTTON` | `BaseTileData` | id, (capabilityID OR flowID) | Action triggers |

### Type Inference Magic

```typescript
// This type automatically maps string literals to their interfaces
type TileConfigByType<T extends TileType> = Extract<Tile, { type: T }>;

// Examples:
// TileConfigByType<'SLIDER'> => SliderTile interface
// TileConfigByType<'SWITCH'> => SwitchTile interface
```

## Basic Usage

### 1. Creating Type-Safe Configurations

```typescript
import { createTileConfig } from './types';

// ✅ SLIDER - TypeScript enforces ALL required properties
const sliderTile = createTileConfig('SLIDER', {
  position: [0, 0],           // Required: grid position
  width: 2,                   // Required: tile width
  height: 1,                  // Required: tile height
  id: 'dimmer-123',           // Required: device ID
  capabilityID: 'dim',        // Required: capability to control
  orientation: 'horizontal',   // Required: slider direction
  minValue: 0,                // Required: minimum value
  maxValue: 100,              // Required: maximum value
  step: 1,                    // Required: step increment
  // Optional properties:
  name: 'Living Room Light',  // Optional: display name
  unit: '%',                  // Optional: unit symbol
  showValue: true             // Optional: show current value
});

// ✅ SWITCH - Different required properties
const switchTile = createTileConfig('SWITCH', {
  position: [1, 0],
  width: 1,
  height: 1,
  id: 'light-456',
  capabilityID: 'onoff',
  // Optional switch-specific properties:
  clickable: true,
  icons: {
    on: 'mdi-lightbulb-on',
    off: 'mdi-lightbulb-off'
  }
});

// ✅ VIRTUAL - No device properties needed
const virtualTile = createTileConfig('VIRTUAL', {
  position: [2, 0],
  width: 1,
  height: 1,
  name: 'Spacer'
});
```

### 2. What TypeScript Prevents

```typescript
// ❌ Missing required properties
const brokenSlider = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 2,
  height: 1,
  id: 'dimmer-123',
  capabilityID: 'dim'
  // Missing: orientation, minValue, maxValue, step
  // TypeScript Error: Property 'orientation' is missing
});

// ❌ Invalid properties for tile type
const invalidSwitch = createTileConfig('SWITCH', {
  position: [1, 0],
  width: 1,
  height: 1,
  id: 'light-456',
  capabilityID: 'onoff',
  orientation: 'horizontal'  // ❌ SWITCH tiles don't have orientation
  // TypeScript Error: Property 'orientation' does not exist
});

// ❌ Wrong property types
const wrongTypes = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 2,
  height: 1,
  id: 'dimmer-123',
  capabilityID: 'dim',
  orientation: 'diagonal',    // ❌ Must be 'horizontal' | 'vertical'
  minValue: '0',             // ❌ Must be number, not string
  maxValue: 100,
  step: 1
});
```

## Advanced Features

### 1. Runtime Type Guards

```typescript
import { isTileOfType, isDeviceTile } from './types';

function handleTileConfiguration(tile: Tile): void {
  // Type guard automatically narrows the tile type
  if (isTileOfType(tile, 'SLIDER')) {
    // tile is now SliderTile - TypeScript knows ALL properties
    console.log(`Slider: ${tile.minValue}-${tile.maxValue}, step: ${tile.step}`);
    console.log(`Orientation: ${tile.orientation}`);
    
    // ✅ Full autocomplete available for slider properties
    if (tile.showValue) {
      console.log(`Unit: ${tile.unit || 'no unit'}`);
    }
  }
  
  if (isTileOfType(tile, 'SWITCH')) {
    // tile is now SwitchTile
    console.log(`Switch clickable: ${tile.clickable || false}`);
    if (tile.icons) {
      console.log(`Icons: ${tile.icons.on} / ${tile.icons.off}`);
    }
  }
  
  if (isTileOfType(tile, 'SENSOR')) {
    // tile is now SensorTile
    console.log(`Sensor unit: ${tile.unit}`);
    if (tile.secondValue) {
      console.log(`Second value: ${tile.secondValue.capabilityID}`);
    }
  }
  
  // Generic device tile handling
  if (isDeviceTile(tile)) {
    // tile now guaranteed to have 'id' and 'capabilityID'
    console.log(`Device tile: ${tile.id}:${tile.capabilityID}`);
  }
}
```

### 2. TileFactory Usage

```typescript
import { TileFactory } from './tiles/TileFactory';

// Create configuration with factory
const config = TileFactory.createConfig('SLIDER', {
  position: [0, 0],
  width: 2,
  height: 1,
  id: 'dimmer-123',
  capabilityID: 'dim',
  orientation: 'horizontal',
  minValue: 0,
  maxValue: 100,
  step: 5
});

// Create configuration with automatic defaults
const configWithDefaults = TileFactory.createConfigWithDefaults('SWITCH', {
  position: [1, 0],
  id: 'light-456',
  capabilityID: 'onoff',
  name: 'Kitchen Light'
  // width: 1, height: 1, clickable: true added automatically
});

// Validate configuration
const validation = TileFactory.validateConfig(config);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Create actual tile instance
const tileElement = document.createElement('div');
const homeyDevice = await homeyClient.getDevice('dimmer-123');
const tile = TileFactory.createTile('tile-1', config, homeyDevice, tileElement, homeyApi);
```

### 3. Batch Operations

```typescript
const allConfigs = [sliderConfig, switchConfig, sensorConfig];

// Extract all required device IDs
const deviceIds = TileFactory.getRequiredDevices(allConfigs);
console.log('Required devices:', deviceIds);
// Output: ['dimmer-123', 'light-456', 'temp-sensor-789']

// Group tiles by type for batch processing
const groupedTiles = TileFactory.groupTilesByType(allConfigs);
console.log('Grouped tiles:', groupedTiles);
// Output: { 
//   SLIDER: [sliderConfig], 
//   SWITCH: [switchConfig], 
//   SENSOR: [sensorConfig] 
// }

// Process each type differently
Object.entries(groupedTiles).forEach(([tileType, configs]) => {
  console.log(`Processing ${configs.length} ${tileType} tiles`);
  configs.forEach(config => {
    if (isTileOfType(config, tileType as TileType)) {
      // Type-safe processing based on tile type
    }
  });
});
```

### 4. Generic Type-Safe Functions

```typescript
// Function that works with any tile type but maintains type safety
function processTileByType<T extends TileType>(
  type: T, 
  config: TileConfigByType<T>
): void {
  console.log(`Processing ${type} tile`);
  
  // TypeScript knows the exact config type based on type parameter
  switch (type) {
    case 'SLIDER':
      const slider = config as SliderTile;
      console.log(`Slider range: ${slider.minValue}-${slider.maxValue}`);
      break;
      
    case 'SWITCH':
      const switchTile = config as SwitchTile;
      console.log(`Switch clickable: ${switchTile.clickable}`);
      break;
      
    case 'SENSOR':
      const sensor = config as SensorTile;
      console.log(`Sensor unit: ${sensor.unit}`);
      break;
  }
}

// Usage with automatic type inference
processTileByType('SLIDER', sliderConfig);  // ✅ Fully type-safe
processTileByType('SWITCH', switchConfig);  // ✅ Fully type-safe
processTileByType('SENSOR', sensorConfig);  // ✅ Fully type-safe
```

## API Reference

### Core Functions

#### `createTileConfig<T>(type: T, config: Omit<TileConfigByType<T>, 'type'>)`
Creates a type-safe tile configuration.

**Parameters:**
- `type`: Tile type string literal (`'SLIDER'`, `'SWITCH'`, etc.)
- `config`: Configuration object without the `type` property

**Returns:** Complete tile configuration with inferred type

**Example:**
```typescript
const config = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 2,
  height: 1,
  id: 'device-123',
  capabilityID: 'dim',
  orientation: 'horizontal',
  minValue: 0,
  maxValue: 100,
  step: 1
});
```

#### `isTileOfType<T>(tile: Tile, type: T): tile is TileConfigByType<T>`
Type guard that narrows a tile to a specific type.

**Parameters:**
- `tile`: Any tile configuration
- `type`: Tile type to check for

**Returns:** Boolean, and narrows the tile type if true

**Example:**
```typescript
if (isTileOfType(tile, 'SLIDER')) {
  // tile is now SliderTile
  console.log(tile.orientation); // ✅ Type-safe access
}
```

#### `isDeviceTile(tile: Tile): tile is Tile & DeviceTileData`
Checks if a tile connects to a device.

**Parameters:**
- `tile`: Any tile configuration

**Returns:** Boolean, and narrows to device tile if true

### TileFactory Methods

#### `TileFactory.createConfig<T>(type: T, config: Omit<TileConfigByType<T>, 'type'>)`
Same as `createTileConfig` but through factory class.

#### `TileFactory.createConfigWithDefaults<T>(type: T, config: Partial<Omit<TileConfigByType<T>, 'type'>>)`
Creates configuration with automatic defaults.

**Example:**
```typescript
const config = TileFactory.createConfigWithDefaults('SWITCH', {
  position: [0, 0],
  id: 'light-123',
  capabilityID: 'onoff'
  // width: 1, height: 1, clickable: true added automatically
});
```

#### `TileFactory.validateConfig(config: Tile): { isValid: boolean; errors: string[] }`
Validates tile configuration with type-specific rules.

#### `TileFactory.getDefaults<T>(type: T): Partial<TileConfigByType<T>>`
Gets default properties for a tile type.

#### `TileFactory.getRequiredDevices(configs: Tile[]): string[]`
Extracts all device IDs from tile configurations.

#### `TileFactory.groupTilesByType(configs: Tile[]): Record<TileType, Tile[]>`
Groups tiles by their type for batch processing.

#### `TileFactory.createTile(tileId, config, device, element, homeyApi): BaseTile`
Creates actual tile instance from configuration.

### Type Utilities

#### `TileType`
Union type of all tile type strings: `'VIRTUAL' | 'SLIDER' | 'SWITCH' | 'SENSOR' | 'BUTTON' | ...`

#### `TileConfigByType<T>`
Maps tile type string to its interface:
- `TileConfigByType<'SLIDER'>` → `SliderTile`
- `TileConfigByType<'SWITCH'>` → `SwitchTile`

## Best Practices

### 1. Always Use Type-Safe Creation
```typescript
// ✅ Good - Type-safe
const config = createTileConfig('SLIDER', { /* properties */ });

// ❌ Bad - No type safety
const config = { type: 'SLIDER', /* properties */ } as Tile;
```

### 2. Use Type Guards for Runtime Logic
```typescript
// ✅ Good - Type-safe property access
if (isTileOfType(tile, 'SLIDER')) {
  console.log(tile.orientation); // ✅ Safe
}

// ❌ Bad - Unsafe casting
console.log((tile as SliderTile).orientation); // ❌ Might crash
```

### 3. Validate Configurations
```typescript
// ✅ Good - Validate before use
const validation = TileFactory.validateConfig(config);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// ❌ Bad - No validation
// Use config directly without checking
```

### 4. Use Factory Defaults When Appropriate
```typescript
// ✅ Good - Use defaults for common properties
const config = TileFactory.createConfigWithDefaults('SWITCH', {
  position: [0, 0],
  id: 'light-123',
  capabilityID: 'onoff'
  // Sensible defaults applied automatically
});

// ❌ Verbose - Specify every property manually
const config = createTileConfig('SWITCH', {
  position: [0, 0],
  width: 1,        // Could be default
  height: 1,       // Could be default
  clickable: true, // Could be default
  id: 'light-123',
  capabilityID: 'onoff'
});
```

### 5. Leverage Batch Operations
```typescript
// ✅ Good - Process tiles efficiently
const deviceIds = TileFactory.getRequiredDevices(allConfigs);
const devices = await Promise.all(
  deviceIds.map(id => homeyClient.getDevice(id))
);

// ❌ Bad - Load devices one by one
configs.forEach(async config => {
  if (isDeviceTile(config)) {
    await homeyClient.getDevice(config.id); // Inefficient
  }
});
```

## Troubleshooting

### Common TypeScript Errors

#### "Property 'X' is missing in type"
**Problem:** Required property not provided
```typescript
// ❌ Error
const config = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'device-123',
  capabilityID: 'dim'
  // Missing: orientation, minValue, maxValue, step
});
```

**Solution:** Add all required properties
```typescript
// ✅ Fixed
const config = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'device-123',
  capabilityID: 'dim',
  orientation: 'horizontal',
  minValue: 0,
  maxValue: 100,
  step: 1
});
```

#### "Property 'X' does not exist on type"
**Problem:** Using property that doesn't exist on tile type
```typescript
// ❌ Error
const config = createTileConfig('SWITCH', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'light-123',
  capabilityID: 'onoff',
  orientation: 'horizontal' // ❌ Switch tiles don't have orientation
});
```

**Solution:** Remove invalid property or use correct tile type
```typescript
// ✅ Fixed - Remove invalid property
const config = createTileConfig('SWITCH', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'light-123',
  capabilityID: 'onoff'
});

// ✅ Or use SLIDER if you need orientation
const config = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'light-123',
  capabilityID: 'onoff',
  orientation: 'horizontal',
  minValue: 0,
  maxValue: 100,
  step: 1
});
```

#### "Type 'string' is not assignable to type"
**Problem:** Using wrong value for constrained property
```typescript
// ❌ Error
const config = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'device-123',
  capabilityID: 'dim',
  orientation: 'diagonal', // ❌ Must be 'horizontal' | 'vertical'
  minValue: 0,
  maxValue: 100,
  step: 1
});
```

**Solution:** Use valid value
```typescript
// ✅ Fixed
const config = createTileConfig('SLIDER', {
  position: [0, 0],
  width: 1,
  height: 1,
  id: 'device-123',
  capabilityID: 'dim',
  orientation: 'horizontal', // ✅ Valid value
  minValue: 0,
  maxValue: 100,
  step: 1
});
```

### Runtime Issues

#### Validation Failures
Check validation results before using configurations:
```typescript
const validation = TileFactory.validateConfig(config);
if (!validation.isValid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => console.error(`- ${error}`));
  return; // Don't use invalid config
}
```

#### Type Guard False Positives
Ensure your tile configurations have the correct `type` property:
```typescript
// ✅ Correct
const config = createTileConfig('SLIDER', { /* ... */ });
// config.type === 'SLIDER'

// ❌ Manual assignment might be wrong
const config = { type: 'SWITCH', /* slider properties */ } as Tile;
// Type guard will fail because type doesn't match properties
```

## Summary

The TileDash TypeScript type system provides:

- 🔒 **Compile-time safety** - Catch errors before runtime
- 🎯 **Automatic type inference** - Types flow through your code
- 💡 **IntelliSense support** - Full IDE autocomplete
- 🛡️ **Runtime type guards** - Safe property access
- 📚 **Self-documenting code** - Types serve as documentation
- 🔄 **Easy refactoring** - Change types confidently

Use the type-safe functions (`createTileConfig`, `isTileOfType`) and TileFactory class for the best developer experience and runtime safety.
