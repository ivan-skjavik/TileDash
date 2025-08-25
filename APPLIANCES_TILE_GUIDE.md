# Appliances Tile Usage Guide

The Appliances tile is a specialized multi-device tile that automatically organizes devices into two columns based on their capabilities:

- **Left Column**: Non-dimmable devices (switches, plugs, etc.)
- **Right Column**: Dimmable devices (lights with dimming capability)

## Basic Configuration

### Simple Appliances Tile
```typescript
const appliancesTile: AppliancesTile = {
  type: 'APPLIANCES',
  position: [0, 0],
  width: 3,
  height: 2,
  name: 'Living Room',
  icon: 'mdi-home',
  
  // Multi-device configuration
  devices: [
    // Non-dimmable devices (will appear in left column)
    { deviceId: 'tv-living-room-001', capabilityId: 'onoff', alias: 'tv' },
    { deviceId: 'fan-ceiling-002', capabilityId: 'onoff', alias: 'ceiling_fan' },
    { deviceId: 'outlet-wall-003', capabilityId: 'onoff', alias: 'wall_outlet' },
    
    // Dimmable devices (will appear in right column)
    { deviceId: 'light-main-004', capabilityIds: ['onoff', 'dim'], alias: 'main_light' },
    { deviceId: 'light-accent-005', capabilityIds: ['onoff', 'dim'], alias: 'accent_light' },
  ],
  
  maxRows: 2,
  showNames: true,
  iconSize: 24,
  itemSpacing: 8
};
```

### Customized Appliances Tile
```typescript
const kitchenAppliancesTile: AppliancesTile = {
  type: 'APPLIANCES',
  position: [3, 0],
  width: 4,
  height: 2,
  name: 'Kitchen Appliances',
  icon: 'mdi-chef-hat',
  
  devices: [
    // Kitchen appliances (non-dimmable)
    { deviceId: 'coffee-maker-001', capabilityId: 'onoff', alias: 'coffee_maker' },
    { deviceId: 'dishwasher-002', capabilityId: 'onoff', alias: 'dishwasher' },
    { deviceId: 'garbage-disposal-003', capabilityId: 'onoff', alias: 'disposal' },
    { deviceId: 'microwave-004', capabilityId: 'onoff', alias: 'microwave' },
    
    // Kitchen lighting (dimmable)
    { deviceId: 'light-under-cabinet-005', capabilityIds: ['onoff', 'dim'], alias: 'under_cabinet' },
    { deviceId: 'light-pendant-006', capabilityIds: ['onoff', 'dim'], alias: 'pendant' },
    { deviceId: 'light-recessed-007', capabilityIds: ['onoff', 'dim'], alias: 'recessed' },
  ],
  
  maxRows: 2,
  showNames: true,
  iconSize: 28,
  itemSpacing: 10,
  
  // Custom icons for each device
  customIcons: {
    'coffee-maker-001': {
      on: 'mdi-coffee-maker',
      off: 'mdi-coffee-maker-outline'
    },
    'dishwasher-002': {
      on: 'mdi-dishwasher',
      off: 'mdi-dishwasher-off'
    },
    'garbage-disposal-003': {
      on: 'mdi-delete',
      off: 'mdi-delete-outline'
    },
    'microwave-004': {
      on: 'mdi-microwave',
      off: 'mdi-microwave-off'
    },
    'light-under-cabinet-005': {
      on: 'mdi-led-strip',
      off: 'mdi-led-strip-variant-off',
      dimming: 'mdi-led-strip-variant'
    },
    'light-pendant-006': {
      on: 'mdi-ceiling-light',
      off: 'mdi-ceiling-light-outline',
      dimming: 'mdi-ceiling-light-multiple'
    }
  }
};
```

## Configuration Options

### Required Properties
- `type: 'APPLIANCES'` - Tile type identifier
- `position: [x, y]` - Grid position
- `width: number` - Tile width in grid units
- `height: number` - Tile height in grid units
- `devices: DeviceCapabilityMapping[]` - Array of device configurations

### Optional Properties
- `name?: string` - Tile header name
- `icon?: string` - Tile header icon
- `maxRows?: 1 | 2` - Maximum rows to display (default: 2)
- `showNames?: boolean` - Show device names (default: true)
- `iconSize?: number` - Icon size in pixels (default: 24, range: 12-48)
- `itemSpacing?: number` - Spacing between devices in pixels (default: 8)
- `customIcons?: object` - Custom icon mappings for each device

### Custom Icons Structure
```typescript
customIcons: {
  [deviceId: string]: {
    on?: string;      // Icon when device is on
    off?: string;     // Icon when device is off
    dimming?: string; // Icon when device is dimming (for dimmable devices)
  }
}
```

## Device Behavior

### Non-Dimmable Devices (Left Column)
- **Click**: Toggle on/off
- **Visual**: Green background when on, default background when off
- **Capabilities**: Typically just `onoff`

### Dimmable Devices (Right Column)
- **Click**: Cycle through dim levels (off → 33% → 66% → 100% → off)
- **Visual**: Blue background with opacity matching dim level
- **Capabilities**: Both `onoff` and `dim`

## Layout Behavior

### Automatic Column Organization
The tile automatically separates devices based on their capabilities:
- Devices with only `onoff` → Left column
- Devices with both `onoff` and `dim` → Right column

### Grid Layout
- Devices are arranged in a grid within each column
- Grid automatically adjusts based on number of devices and `maxRows` setting
- Each device gets equal space within its column

### Responsive Design
- Automatically adjusts icon and text sizes on mobile devices
- Reduces spacing and padding for smaller screens
- Maintains usability across different screen sizes

## Advanced Examples

### Single Row Configuration
```typescript
const compactAppliancesTile: AppliancesTile = {
  type: 'APPLIANCES',
  position: [0, 2],
  width: 6,
  height: 1,
  name: 'Quick Controls',
  
  devices: [
    { deviceId: 'main-switch-001', capabilityId: 'onoff', alias: 'main' },
    { deviceId: 'security-light-002', capabilityIds: ['onoff', 'dim'], alias: 'security' },
  ],
  
  maxRows: 1,
  showNames: false,
  iconSize: 32
};
```

### Large Appliances Dashboard
```typescript
const fullAppliancesTile: AppliancesTile = {
  type: 'APPLIANCES',
  position: [0, 0],
  width: 6,
  height: 3,
  name: 'All Appliances',
  icon: 'mdi-home-automation',
  
  devices: [
    // Many non-dimmable devices
    { deviceId: 'tv-001', capabilityId: 'onoff' },
    { deviceId: 'stereo-002', capabilityId: 'onoff' },
    { deviceId: 'fan-003', capabilityId: 'onoff' },
    { deviceId: 'heater-004', capabilityId: 'onoff' },
    { deviceId: 'humidifier-005', capabilityId: 'onoff' },
    { deviceId: 'air-purifier-006', capabilityId: 'onoff' },
    
    // Many dimmable devices
    { deviceId: 'light-living-007', capabilityIds: ['onoff', 'dim'] },
    { deviceId: 'light-dining-008', capabilityIds: ['onoff', 'dim'] },
    { deviceId: 'light-kitchen-009', capabilityIds: ['onoff', 'dim'] },
    { deviceId: 'light-bedroom-010', capabilityIds: ['onoff', 'dim'] },
    { deviceId: 'light-bathroom-011', capabilityIds: ['onoff', 'dim'] },
    { deviceId: 'light-hallway-012', capabilityIds: ['onoff', 'dim'] },
  ],
  
  maxRows: 2,
  showNames: true,
  iconSize: 20,
  itemSpacing: 6
};
```

## Styling and Theming

### CSS Variables
The Appliances tile respects the following CSS variables:
- `--tile-background` - Background color for devices
- `--tile-active-background` - Background color for active non-dimmable devices
- `--tile-dimming-background` - Background color for dimming devices  
- `--tile-error-background` - Background color for error states
- `--text-color` - Text color
- `--border-color` - Border colors
- `--primary-color` - Accent colors

### Dark Theme Support
Automatically adapts to dark themes using CSS media queries and dark theme CSS variables.

## Integration with Dashboard

### TileFactory Support
The Appliances tile is fully integrated with the TileFactory:

```typescript
import { TileFactory } from './tiles/TileFactory';

// Create with defaults
const config = TileFactory.createConfigWithDefaults('APPLIANCES', {
  position: [0, 0],
  name: 'My Appliances',
  devices: [
    // ... device configurations
  ]
});

// Validate configuration
const validation = TileFactory.validateConfig(config);
if (!validation.isValid) {
  console.error('Invalid config:', validation.errors);
}

// Create tile instance
const tile = TileFactory.createTile(
  'appliances-1', 
  config, 
  deviceArray, 
  element, 
  homeyApi
);
```

### Multi-Device Architecture
The Appliances tile showcases the full capabilities of the new multi-device architecture:
- Handles multiple devices with different capabilities
- Automatic device-capability mapping
- Efficient event handling for all devices
- Type-safe configuration and validation

## Best Practices

1. **Group Related Devices**: Use appliances tiles to group devices by room or function
2. **Appropriate Sizing**: Use adequate tile size (recommend 3x2 or 4x2) for good usability
3. **Custom Icons**: Define custom icons to make devices easily recognizable
4. **Meaningful Names**: Use clear, short device names
5. **Logical Grouping**: Consider grouping by room, function, or usage frequency

## Troubleshooting

### Common Issues

**Devices not appearing in expected columns**:
- Check that dimmable devices have both `onoff` and `dim` capabilities
- Verify device capability configuration is correct

**Icons not displaying**:
- Ensure MDI icons start with `mdi-` prefix
- Check that custom icon names are valid MDI icons
- Verify device IDs match between `devices` and `customIcons`

**Layout issues**:
- Adjust `maxRows`, `itemSpacing`, and tile dimensions
- Consider reducing `iconSize` for tiles with many devices
- Check responsive behavior on target devices
