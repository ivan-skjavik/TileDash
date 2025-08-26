# TileDash Shoelace Integration Guide

## Installation

Add Shoelace to your project:

```bash
npm install @shoelace-style/shoelace
```

## Setup

### 1. Import Shoelace in your main entry file (src/main.ts):

```typescript
// Import Shoelace CSS theme
import '@shoelace-style/shoelace/dist/themes/light.css';

// Import components you'll use
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

// Set the base path for Shoelace assets
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.1/cdn/');

// OR if you want to serve assets locally:
// setBasePath('/node_modules/@shoelace-style/shoelace/dist/');
```

### 2. Update vite.config.js to copy Shoelace assets:

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  // ... your existing config
  assetsInclude: ['**/*.woff', '**/*.woff2'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.woff2')) {
            return 'assets/fonts/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
})
```

### 3. Update app.scss to import Shoelace tile styles:

```scss
// ... your existing imports
@import 'components/appliances-tile-shoelace';
```

### 4. Add TypeScript declarations (src/types/shoelace.d.ts):

```typescript
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sl-switch': any;
      'sl-range': any;
      'sl-badge': any;
      'sl-icon': any;
    }
  }
}
```

## Usage

### Update TileFactory to use Shoelace version:

```typescript
// In TileFactory.ts, import the Shoelace version
import { AppliancesTileShoelace } from './AppliancesTileShoelace.js';

// Update the factory method
if (isTileOfType(config, 'APPLIANCES')) {
    // Use Shoelace version instead
    return new AppliancesTileShoelace(tileId, devices, config, element, homeyApi);
}
```

### Or create a configuration option:

```typescript
// In your config, add a flag to choose implementation
export interface AppliancesTile extends DeviceTileData {
  type: 'APPLIANCES';
  useShoelace?: boolean; // New optional flag
  // ... other properties
}

// In TileFactory.ts
if (isTileOfType(config, 'APPLIANCES')) {
    if (config.useShoelace) {
        return new AppliancesTileShoelace(tileId, devices, config, element, homeyApi);
    } else {
        return new AppliancesTile(tileId, devices, config, element, homeyApi);
    }
}
```

## Benefits of Shoelace Integration

### ✅ Advantages:
- **Faster Development**: No need to create custom switches, sliders, badges, etc.
- **Accessibility**: Built-in ARIA support, keyboard navigation, screen reader compatibility
- **Professional Design**: Polished, consistent UI components
- **Theming**: Easy customization via CSS custom properties
- **Maintenance**: Components are maintained by the Shoelace team
- **TypeScript**: Full TypeScript support available
- **Framework Agnostic**: Works with any framework or vanilla JS

### ⚠️ Considerations:
- **Bundle Size**: Adds ~50-100KB to your bundle (depending on components used)
- **Learning Curve**: Need to learn Shoelace's customization patterns
- **Web Components**: Requires modern browser support
- **Dependency**: Additional third-party dependency to maintain

## Migration Strategy

1. **Start with new tiles**: Use Shoelace for any new tile types
2. **Parallel implementation**: Keep both versions during transition
3. **Gradual migration**: Move existing tiles to Shoelace version over time
4. **A/B testing**: Use configuration flag to test both versions
5. **Complete transition**: Once confident, remove manual components

## Customization Examples

### Dark Theme Overrides:
```scss
.appliances-tile--shoelace {
  sl-switch {
    &::part(control) {
      border-color: rgba(255, 255, 255, 0.3);
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    &[checked]::part(control) {
      background-color: #4CAF50;
    }
  }
}
```

### Custom Colors:
```scss
:root {
  --sl-color-primary-600: #667eea; // Your brand color
  --sl-color-success-600: #4CAF50;  // Active state color
}
```

## Performance Considerations

- Use tree-shaking: Only import components you actually use
- Consider lazy loading: Load components on-demand if needed
- Bundle analysis: Monitor bundle size impact
- CDN option: Consider using CDN for faster loading (but less control)

## Testing

The demo files created show:
1. Visual comparison between manual and Shoelace components
2. Interactive examples of switches and sliders
3. Complete AppliancesTile implementation with Shoelace
4. Styling examples for dark/light themes

Files created:
- `shoelace-demo.html` - Visual demo and comparison
- `src/tiles/AppliancesTileShoelace.ts` - Complete Shoelace implementation
- `src/styles/components/_appliances-tile-shoelace.scss` - Shoelace-specific styling
