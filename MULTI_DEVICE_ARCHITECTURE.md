# Multi-Device Tile Architecture

This document explains the new multi-device architecture for TileDash tiles, which allows a single tile to control one or multiple devices, each with one or multiple capabilities.

## Overview

The enhanced BaseTile architecture supports:
- **Single Device, Single Capability** (legacy format)
- **Single Device, Multiple Capabilities**
- **Multiple Devices, Single Capability Each**
- **Multiple Devices, Multiple Capabilities**

## Configuration Examples

### 1. Single Device, Single Capability (Legacy Format)
```typescript
const lightSwitchTile: SwitchTile = {
  type: 'SWITCH',
  position: [0, 0],
  width: 1,
  height: 1,
  name: 'Living Room Light',
  icon: 'mdi-lightbulb',
  // Legacy format - still supported
  id: 'light-living-room-123',
  capabilityID: 'onoff'
};
```

### 2. Single Device, Multiple Capabilities
```typescript
const dimmerTile: SliderTile = {
  type: 'SLIDER',
  position: [1, 0],
  width: 2,
  height: 1,
  name: 'Bedroom Dimmer',
  icon: 'mdi-lightbulb-variant',
  // New format - single device, multiple capabilities
  devices: [{
    deviceId: 'dimmer-bedroom-456',
    capabilityIds: ['onoff', 'dim'],
    alias: 'bedroom_light'
  }],
  multiDeviceMode: 'synchronized',
  orientation: 'horizontal',
  minValue: 0,
  maxValue: 1,
  step: 0.05
};
```

### 3. Multiple Devices, Single Capability Each
```typescript
const allLightsSwitchTile: SwitchTile = {
  type: 'SWITCH',
  position: [0, 1],
  width: 2,
  height: 1,
  name: 'All Lights',
  icon: 'mdi-lightbulb-multiple',
  // Multiple devices, same capability
  devices: [
    { deviceId: 'light-living-room-123', capabilityId: 'onoff', alias: 'living_room' },
    { deviceId: 'light-kitchen-456', capabilityId: 'onoff', alias: 'kitchen' },
    { deviceId: 'light-bedroom-789', capabilityId: 'onoff', alias: 'bedroom' }
  ],
  multiDeviceMode: 'synchronized' // All lights turn on/off together
};
```

### 4. Multiple Devices, Multiple Capabilities
```typescript
const hvacControlTile: SensorTile = {
  type: 'SENSOR',
  position: [2, 0],
  width: 3,
  height: 2,
  name: 'HVAC Control',
  icon: 'mdi-thermostat',
  // Multiple devices with different capabilities
  devices: [
    { 
      deviceId: 'thermostat-main-001', 
      capabilityIds: ['measure_temperature', 'target_temperature', 'onoff'],
      alias: 'main_thermostat'
    },
    { 
      deviceId: 'sensor-humidity-002', 
      capabilityId: 'measure_humidity',
      alias: 'humidity_sensor'
    },
    { 
      deviceId: 'fan-ceiling-003', 
      capabilityIds: ['onoff', 'fan_speed'],
      alias: 'ceiling_fan'
    }
  ],
  multiDeviceMode: 'individual',
  unit: '°C'
};
```

## Multi-Device Control Modes

### `synchronized`
All devices respond to the same action simultaneously.
- **Use Case**: Master switch for multiple lights
- **Example**: Clicking the tile turns all lights on/off together

### `individual`
Each device can be controlled separately within the tile.
- **Use Case**: Complex control panels with multiple sub-controls
- **Example**: Thermostat tile with separate temperature, humidity, and fan controls

### `aggregated`
Shows combined state and allows group actions.
- **Use Case**: Status overview with group control options
- **Example**: "3 of 5 lights on" with option to turn all on/off

## BaseTile API Changes

### New Methods

```typescript
// Device and capability access
protected getCapabilityValue(deviceId: string, capabilityId: string): any
protected getCapability(deviceId: string, capabilityId: string): any
protected getDevice(deviceId: string): HomeyDevice | undefined
protected getAllDevices(): HomeyDevice[]

// Multi-device queries
protected isMultiDevice(): boolean
protected hasMultipleCapabilities(): boolean
protected getAllDeviceCapabilities(): Array<{deviceId: string; capabilityId: string; alias?: string}>

// Control methods
protected async setCapabilityValue(deviceId: string, capabilityId: string, value: any): Promise<void>
protected async setCapabilityValueAll(capabilityId: string, value: any): Promise<void>

// Legacy compatibility
protected getPrimaryDeviceCapability(): {deviceId: string; capabilityId: string} | undefined
protected getCapabilityID(): string | undefined // @deprecated
protected getDeviceID(): string | undefined // @deprecated
```

### Updated Abstract Methods

```typescript
// Updated update method signature
abstract update(newValue: any, capabilityId: string, deviceId?: string): void;
```

## Implementation Example

Here's how to implement a multi-device tile:

```typescript
export class MultiLightSwitchTile extends BaseTile {
  render(): void {
    this.element.classList.add('multi-light-switch');
    
    if (this.isMultiDevice()) {
      this.renderMultiDeviceInterface();
    } else {
      this.renderSingleDeviceInterface();
    }
    
    this.setupEventListeners();
  }

  private renderMultiDeviceInterface(): void {
    const devices = this.getAllDevices();
    const config = this.config as SwitchTile;
    
    // Create container for multiple device controls
    const container = document.createElement('div');
    container.classList.add('multi-device-container');
    
    if (config.multiDeviceMode === 'synchronized') {
      // Single control for all devices
      this.createSynchronizedControl(container);
    } else if (config.multiDeviceMode === 'individual') {
      // Individual controls for each device
      devices.forEach(device => {
        this.createIndividualControl(container, device.id);
      });
    } else if (config.multiDeviceMode === 'aggregated') {
      // Aggregated view with group controls
      this.createAggregatedControl(container);
    }
    
    this.element.appendChild(container);
  }

  update(newValue: any, capabilityId: string, deviceId?: string): void {
    console.log(`Update: ${deviceId}:${capabilityId} = ${newValue}`);
    
    if (this.isMultiDevice()) {
      this.updateMultiDeviceDisplay(newValue, capabilityId, deviceId!);
    } else {
      this.updateSingleDeviceDisplay(newValue, capabilityId);
    }
  }

  private async handleSynchronizedToggle(): Promise<void> {
    const capabilities = this.getAllDeviceCapabilities();
    const onOffCapabilities = capabilities.filter(c => c.capabilityId === 'onoff');
    
    // Get current state of first device to determine new state
    const firstDevice = onOffCapabilities[0];
    const currentValue = this.getCapabilityValue(firstDevice.deviceId, firstDevice.capabilityId);
    const newValue = !currentValue;
    
    // Set all devices to the new state
    await this.setCapabilityValueAll('onoff', newValue);
  }
}
```

## Migration Guide

### From Legacy Single-Device Tiles

**Before:**
```typescript
// Old tile implementation
export class OldSwitchTile extends BaseTile {
  constructor(tileId: string, device: HomeyDevice | null, config: SwitchTile, element: HTMLElement, homeyApi: HomeyAPIV3LocalPatched) {
    super(tileId, device, config, element, homeyApi);
  }
  
  update(newValue: any, capability: string): void {
    // Handle single device update
  }
}
```

**After:**
```typescript
// New tile implementation
export class NewSwitchTile extends BaseTile {
  constructor(tileId: string, devices: HomeyDevice[], config: SwitchTile, element: HTMLElement, homeyApi: HomeyAPIV3LocalPatched) {
    super(tileId, devices, config, element, homeyApi);
  }
  
  update(newValue: any, capabilityId: string, deviceId?: string): void {
    // Handle multi-device update
    if (deviceId) {
      // Update specific device
    } else {
      // Update primary device (backward compatibility)
      const primary = this.getPrimaryDeviceCapability();
      if (primary) deviceId = primary.deviceId;
    }
  }
}
```

## Type Utilities

New utility functions are available for working with multi-device configurations:

```typescript
import { 
  isMultiDeviceTile, 
  isSingleDeviceTile, 
  getTileDeviceIds, 
  getTileDeviceCapabilities 
} from '../types';

// Check tile type
if (isMultiDeviceTile(config)) {
  // Handle multi-device configuration
  console.log('Devices:', config.devices);
}

// Get all device IDs from any tile configuration
const deviceIds = getTileDeviceIds(config);

// Get all device-capability combinations
const combinations = getTileDeviceCapabilities(config);
```

## Benefits

1. **Unified Architecture**: Single codebase handles both simple and complex scenarios
2. **Type Safety**: Full TypeScript support with proper type inference
3. **Backward Compatibility**: Existing single-device configurations continue to work
4. **Flexibility**: Support for complex multi-device, multi-capability scenarios
5. **Performance**: Efficient device mapping and event handling
6. **Maintainability**: Clean separation of concerns with clear APIs

## Next Steps

1. Update existing tile implementations to use the new architecture
2. Create new multi-device tile types (HVAC, Security, etc.)
3. Implement UI patterns for different multi-device modes
4. Add configuration validation for complex scenarios
5. Create visual tile builder for multi-device configurations
