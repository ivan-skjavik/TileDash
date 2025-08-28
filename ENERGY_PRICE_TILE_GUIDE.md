# Energy Price Tile Guide

The Energy Price Tile displays real-time Norwegian electricity prices fetched from [hvakosterstrommen.no](https://www.hvakosterstrommen.no/). It shows prices for today and tomorrow (when available) with a line chart and optional current price display.

## Features

- 📊 **Line Chart**: Displays hourly prices with hard edges (no smoothing)
- 🕐 **Current Hour Highlight**: Shows current time with annotation
- 💰 **Current Price Display**: Large price display with color coding
- 🔄 **Auto Refresh**: Configurable refresh intervals (5-60 minutes)
- 🏷️ **Price Zones**: Color coding for cheap/normal/expensive prices
- ⚡ **Tariff & Tax**: Add custom tariff costs and tax percentages
- 🌙 **Theme Support**: Automatic dark/light theme adaptation
- 🚨 **Error Handling**: Visual error states and API failure handling

## Configuration

### Basic Example

```typescript
{
  type: 'ENERGY_PRICE',
  position: [0, 0],
  width: 3,
  height: 2,
  name: 'Strømpris Oslo',
  priceArea: 'NO1',
  refreshInterval: 15,
  showCurrentPrice: true
}
```

### Advanced Example with Tariffs

```typescript
{
  type: 'ENERGY_PRICE',
  position: [0, 0],
  width: 3,
  height: 2,
  name: 'Total strømpris',
  priceArea: 'NO1',
  tariffCost: 35.5,      // øre/kWh additional cost
  taxPercentage: 25,     // 25% tax
  refreshInterval: 15,
  showCurrentPrice: true,
  graphOptions: {
    lineColor: '#2196F3',
    fillColor: '#2196F3',
    currentHourColor: '#FF9800'
  }
}
```

## Configuration Properties

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'ENERGY_PRICE'` | Tile type identifier |
| `position` | `[number, number]` | Grid position `[x, y]` |
| `width` | `number` | Tile width in grid units |
| `height` | `number` | Tile height in grid units |
| `priceArea` | `NorwegianPriceArea` | Price area code (see below) |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | Generated | Display name for the tile |
| `icon` | `string` | `'mdi-flash'` | MDI icon name |
| `tariffCost` | `number` | `0` | Additional tariff cost (øre/kWh) |
| `taxPercentage` | `number` | `25` | Tax percentage to apply |
| `refreshInterval` | `number` | `15` | Refresh interval in minutes (5-60) |
| `showCurrentPrice` | `boolean` | `true` | Show current price display |
| `graphOptions` | `GraphOptions` | Default colors | Chart styling options |

### Price Areas

Norwegian electricity price areas supported:

| Code | Region |
|------|--------|
| `NO1` | Oslo / Øst-Norge |
| `NO2` | Kristiansand / Sør-Norge |
| `NO3` | Trondheim / Midt-Norge |
| `NO4` | Tromsø / Nord-Norge |
| `NO5` | Bergen / Vest-Norge |

### Graph Options

```typescript
interface GraphOptions {
  lineColor?: string;          // Line color (default: CSS variable)
  fillColor?: string;          // Fill area color 
  currentHourColor?: string;   // Current hour annotation color
  priceZones?: {
    cheap: { color: string; threshold: number };
    normal: { color: string; threshold: number };
    expensive: { color: string };
  };
}
```

## Price Calculation

The final displayed price includes:

1. **Base Price**: From hvakosterstrommen.no API (NOK/kWh)
2. **Tariff Cost**: Added as øre/kWh
3. **Tax**: Applied as percentage

```
Final Price = (Base Price × 100 + Tariff Cost) × (1 + Tax% / 100)
```

Example:
- Base price: 0.50 NOK/kWh (50 øre)
- Tariff: 35.5 øre/kWh
- Tax: 25%
- Final: (50 + 35.5) × 1.25 = 106.88 øre/kWh

## Error Handling

The tile handles various error scenarios:

### Visual Error States
- **API Failures**: Tile gets `tile--has-error` class
- **Network Issues**: Shows loading state with retry
- **Invalid Data**: Interpolates missing hourly data
- **Invalid Price Area**: Logs error to console

### Error Classes
```scss
.energy-price-tile.tile--has-error {
  border-color: var(--error-color);
  background: var(--error-background);
}
```

## Data Source

Data is fetched from the public API:
```
https://www.hvakosterstrommen.no/api/v1/prices/{YYYY}/{MM}-{DD}_{AREA}.json
```

Example: `https://www.hvakosterstrommen.no/api/v1/prices/2025/08-26_NO1.json`

### API Response Format
```json
{
  "2025-08-26": [
    {
      "NOK_per_kWh": 0.50123,
      "EUR_per_kWh": 0.04234,
      "EXR": 11.8456,
      "time_start": "2025-08-26T00:00:00+02:00",
      "time_end": "2025-08-26T01:00:00+02:00"
    }
  ]
}
```

## Styling

The tile uses CSS custom properties for theming:

```scss
.energy-price-tile {
  --tile-background: #fff;
  --text-color: #333;
  --primary-color: #2196F3;
  --success-color: #4caf50;  // Cheap prices
  --warning-color: #ff9800;  // Normal prices
  --error-color: #f44336;    // Expensive prices
}
```

### Current Price Color Classes
- `.price-cheap` - Green background for low prices
- `.price-normal` - Orange background for medium prices  
- `.price-expensive` - Red background for high prices

## Recommended Tile Sizes

| Size | Use Case | Current Price |
|------|----------|---------------|
| 2×1 | Compact view | Hidden |
| 3×2 | Standard view | Shown |
| 4×2 | Detailed view | Shown with larger chart |

## Usage with TileFactory

```typescript
import { TileFactory } from '../tiles/TileFactory';

// Create with defaults
const energyTile = TileFactory.createConfigWithDefaults('ENERGY_PRICE', {
  position: [0, 0],
  name: 'Strømpris',
  priceArea: 'NO1'
});

// Validate configuration
const validation = TileFactory.validateConfig(energyTile);
if (!validation.isValid) {
  console.error('Invalid config:', validation.errors);
}

// Create tile instance
const tileElement = document.createElement('div');
const tile = TileFactory.createTile(
  'energy-1',
  energyTile,
  [], // No devices needed
  tileElement,
  homeyApi
);
```

## Best Practices

1. **Refresh Interval**: Use 15-30 minutes to balance data freshness with API load
2. **Tile Size**: Use at least 3×2 for readable charts
3. **Error Handling**: Monitor console for API errors
4. **Theming**: Ensure colors work in both light and dark themes
5. **Performance**: Avoid too many tiles with short refresh intervals

## Troubleshooting

### Common Issues

**Chart not displaying**
- Check browser console for JavaScript errors
- Verify ApexCharts is properly installed
- Ensure container has proper dimensions

**No current price**
- Check if current hour data exists in API response
- Verify time zone calculations
- Check if `showCurrentPrice` is enabled

**API errors**
- Verify internet connection
- Check if API endpoint is accessible
- Validate price area code (NO1-NO5 only)

**Styling issues**
- Ensure SCSS is compiled
- Check CSS custom property values
- Verify dark/light theme classes are applied

For more examples, see `src/examples/energy-price-tile-examples.ts`.
