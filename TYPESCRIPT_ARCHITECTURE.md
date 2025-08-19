# 🏠 TileDash - Modern TypeScript Architecture

This document describes the new TypeScript-based architecture for TileDash, implementing a modern modular tile rendering system.

## 🏗️ Architecture Overview

### Core Components

#### 1. **TileDashCore** (`src/core/TileDashCore.ts`)
- Main application controller
- Manages dashboard configuration, devices, and rendering
- Handles screen saver, time updates, and user interactions
- Coordinates between different system components

#### 2. **HomeyApiService** (`src/services/HomeyApiService.ts`)
- Modern wrapper around Athom Cloud API
- Device state management with real-time updates
- Event system for capability changes
- TypeScript-safe API methods

#### 3. **Tile Renderer System** (`src/tiles/`)
- **BaseTileRenderer**: Abstract base class with common functionality
- **TileFactory**: Orchestrates tile creation and renderer selection
- **Individual Renderers**: Specialized classes for each tile type

### 🎯 Implemented Tile Renderers

| Renderer | Type | Features | Status |
|----------|------|----------|--------|
| `VirtualTileRenderer` | VIRTUAL | Static display tiles | ✅ Complete |
| `SwitchTileRenderer` | SWITCH | On/off device control with state management | ✅ Complete |
| `SensorTileRenderer` | SENSOR | Value display with optional secondary values | ✅ Complete |
| `SliderTileRenderer` | SLIDER | Range input with real-time updates | ✅ Complete |
| `ImageTileRenderer` | IMAGE | Background images with overlay support | ✅ Complete |
| `PopupTileRenderer` | POPUP, VIRTUAL_POPUP | Modal popup with grid layout | ✅ Complete |
| `ButtonTileRenderer` | BUTTON | Trigger actions with visual feedback | ✅ Complete |

## 🔧 Development Environment

### Prerequisites
- **pnpm** package manager
- **Node.js** 18+ 
- **TypeScript** compiler

### Development Scripts
```bash
# Start development server (hot-reload + API server)
pnpm dev

# TypeScript compilation only
pnpm tsc

# Build for production
pnpm build

# Start API server only
pnpm server
```

### Environment Configuration
Create `.env` file with:
```env
HOMEY_TOKEN="your_homey_token_here"
API_PORT=3010
DEV_PORT=3000
```

## 🏗️ Tile Renderer Architecture

### Base Architecture

```typescript
abstract class BaseTileRenderer implements TileRenderer {
  // Common rendering utilities
  protected createIcon(iconName: string, size?: number): HTMLElement
  protected createName(name: string, small?: boolean): HTMLElement  
  protected createValue(value: any, unit?: string): HTMLElement
  
  // Device interaction
  protected getDeviceCapabilityValue(device: HomeyDevice, capabilityID: string): any
  protected addClickHandler(element: HTMLElement, device: HomeyDevice, tile: any): void
  
  // Must be implemented by subclasses
  abstract render(device: HomeyDevice | null, tile: Tile, container: HTMLElement, options: TileRenderOptions): void
}
```

### Example Implementation

```typescript
export class SwitchTileRenderer extends BaseTileRenderer {
  render(device: HomeyDevice | null, tile: SwitchTile, container: HTMLElement, options: TileRenderOptions): void {
    container.classList.add('switch-tile');
    
    // Add icon
    if (tile.icon) {
      const iconElement = this.createIcon(tile.icon, 32, options);
      container.appendChild(iconElement);
    }
    
    // Add name
    if (tile.name) {
      const nameElement = this.createName(tile.name);
      container.appendChild(nameElement);
    }
    
    // Add device state handling
    if (device && tile.capabilityID) {
      this.setupDeviceStateHandling(device, tile, container, options);
    }
  }
}
```

## 🎨 Tile Factory System

The `TileFactory` class manages renderer registration and tile creation:

```typescript
export class TileFactory {
  private renderers = new Map<string, any>();
  
  constructor() {
    // Auto-register all available renderers
    this.renderers.set('SWITCH', new SwitchTileRenderer());
    this.renderers.set('SENSOR', new SensorTileRenderer());
    // ... other renderers
  }
  
  createTile(device: HomeyDevice | null, tile: Tile, options: TileRenderOptions): HTMLElement {
    const renderer = this.renderers.get(tile.type);
    // Create tile element and delegate to appropriate renderer
  }
}
```

## 📝 TypeScript Types

### Core Types (`src/types.ts`)

```typescript
interface HomeyDevice {
  id: string;
  name: string;
  capabilitiesObj: Record<string, HomeyCapability>;
  capabilities: string[];
  // ... other properties
}

interface TileRenderOptions {
  ratio?: number;
  smooth?: boolean;
  isDarkTheme?: boolean;
  homeyApiService?: any;
}

// Union type for all tile types
type Tile = VirtualTile | SwitchTile | SensorTile | SliderTile | ImageTile | PopupTile | ButtonTile;
```

### Tile Type Examples

```typescript
interface SwitchTile extends BaseTile {
  type: 'SWITCH';
  id: string;
  capabilityID: string;
  icons?: {
    on: string;
    off: string;
  };
}

interface SliderTile extends BaseTile {
  type: 'SLIDER';
  id: string;
  capabilityID: string;
  orientation: 'horizontal' | 'vertical';
  minValue: number;
  maxValue: number;
  step: number;
  unit?: string;
}
```

## 🚀 Migration from Legacy JavaScript

### What's Changed

1. **Modular Architecture**: Individual tile renderers replace monolithic JavaScript functions
2. **Type Safety**: Full TypeScript typing for all components
3. **Modern API**: Promise-based methods with async/await
4. **Event System**: Custom events for device state changes
5. **Better Error Handling**: Comprehensive error reporting and fallbacks

### Backward Compatibility

- Legacy JavaScript files remain functional during transition
- New TypeScript system operates alongside existing code  
- Gradual migration path with no breaking changes

### Legacy Files Status

| File | Status | Replacement |
|------|--------|-------------|
| `js/tiledash.app.js` | 🔄 Being replaced | `src/core/TileDashCore.ts` |
| `js/tiledash.helpers.js` | 🔄 Being replaced | `src/utils.ts` |
| `js/type/*.js` | 🔄 Being replaced | `src/tiles/*Renderer.ts` |
| `js/athom-api.min.js` | ✅ Still used | Wrapped by `HomeyApiService` |

## 🔮 Future Enhancements

### Planned Tile Renderers
- `GaugeTileRenderer` - Circular/linear gauge displays
- `MediaTileRenderer` - Media player controls
- `ThermostatTileRenderer` - Temperature control with heating/cooling
- `BinarySensorTileRenderer` - Motion, door, window sensors
- `FlowTileRenderer` - Homey Flow triggers
- `HeimdallTileRenderer` - Security system integration
- `ShutterTileRenderer` - Window covering controls

### Architecture Improvements
- Lazy loading of tile renderers
- Plugin system for custom tile types
- Theme system integration
- Performance optimizations
- Unit test coverage

## 🐛 Debugging

### TypeScript Compilation
```bash
# Check for compilation errors
npx tsc --noEmit

# Watch mode for development
npx tsc --watch
```

### Runtime Debugging
- Browser DevTools: Check console for tile rendering errors
- Network tab: Monitor Homey API calls
- Device state changes logged to console
- Error tiles show specific error messages

### Common Issues
1. **Missing Device**: Tiles show "Device not found" when Homey device is unavailable
2. **API Errors**: Network issues show in console with retry mechanisms
3. **Type Errors**: TypeScript compilation catches most issues before runtime

## 📚 Resources

- [Homey API Documentation](https://apps.developer.homey.app/the-homey-app/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Material Design Icons](https://materialdesignicons.com/)

---

## 🎉 Getting Started with the New Architecture

1. **Setup Environment**: `pnpm install` and create `.env` file
2. **Start Development**: `pnpm dev` for hot-reload development server
3. **Explore Renderers**: Check `src/tiles/` for tile type implementations  
4. **Add Custom Tiles**: Create new renderer class and register in TileFactory
5. **Build & Deploy**: `pnpm build` creates optimized production bundle

The new TypeScript architecture provides a solid foundation for maintaining and extending TileDash with type safety, modularity, and modern development practices! 🚀
