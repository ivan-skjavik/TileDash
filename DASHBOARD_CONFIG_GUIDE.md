# Dashboard Configuration Guide

TileDash now supports multiple dashboards configured in the `config.ts` file. This guide explains how to set up and use multiple dashboards.

## Overview

The new dashboard structure allows you to define multiple dashboards in the `config.ts` file, each with a unique ID. Users can switch between dashboards using URL parameters.

## Configuration Structure

```typescript
export const appConfig: AppConfig = {
  settings: {
    // Global settings that apply to all dashboards
    tileSize: 80,
    tileMargin: 5,
    // ... other settings
  },
  dashboards: [
    {
      id: '1',                    // Unique identifier for the dashboard
      title: 'Main Dashboard',    // Optional title for the dashboard
      pages: [
        // Array of pages for this dashboard
        {
          icon: 'mdi-home',
          groups: [
            // Array of tile groups for this page
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Kitchen Dashboard',
      pages: [
        // Pages for the kitchen dashboard
      ]
    }
  ]
};
```

## URL-Based Dashboard Selection

### Loading a Specific Dashboard

To load a specific dashboard, add the `id` parameter to the URL:

```
http://your-tiledash-url/?id=1    // Loads dashboard with ID '1'
http://your-tiledash-url/?id=2    // Loads dashboard with ID '2'
```

### Default Behavior

- If no `id` parameter is provided, the first dashboard in the array will be loaded
- If an invalid `id` is provided, the first dashboard will be loaded as fallback

## Adding New Dashboards

1. Open `config.ts`
2. Add a new dashboard object to the `dashboards` array:

```typescript
{
  id: 'kitchen',              // Must be unique
  title: 'Kitchen Controls',   // Optional display name
  pages: [
    {
      icon: 'mdi-chef-hat',
      groups: [
        {
          title: "Kitchen Lights",
          width: 6,
          height: 4,
          tiles: [
            // Your kitchen tile configurations
          ]
        }
      ]
    }
  ]
}
```

## Dashboard IDs

- Must be unique across all dashboards
- Can be strings or numbers (as strings)
- Recommended to use descriptive names like 'main', 'kitchen', 'bedroom'
- Will be used in URLs, so keep them URL-friendly

## Migration from Old Structure

If you're migrating from the old single-dashboard structure:

1. The old `dashboard` property has been renamed to `dashboards` (plural)
2. Wrap your existing dashboard configuration in a dashboard object:

**Old:**
```typescript
{
  settings: { /* settings */ },
  dashboard: [ /* pages */ ]  // This was the old structure
}
```

**New:**
```typescript
{
  settings: { /* settings */ },
  dashboards: [               // Now an array of dashboard objects
    {
      id: '1',
      title: 'My Dashboard',
      pages: [ /* pages */ ]   // Your existing pages go here
    }
  ]
}
```

## Features

- **URL-based navigation**: Switch dashboards by changing the URL parameter
- **Fallback handling**: Invalid dashboard IDs fall back to the first dashboard
- **Multiple configurations**: Each dashboard can have multiple pages and different layouts
- **Shared settings**: Global settings apply to all dashboards

## Examples

### Simple Two-Dashboard Setup

```typescript
dashboards: [
  {
    id: 'main',
    title: 'Main Dashboard',
    pages: [
      // Main dashboard pages
    ]
  },
  {
    id: 'mobile',
    title: 'Mobile Dashboard',
    pages: [
      // Simplified mobile layout
    ]
  }
]
```

### Room-Based Dashboards

```typescript
dashboards: [
  {
    id: 'living-room',
    title: 'Living Room',
    pages: [/* living room controls */]
  },
  {
    id: 'bedroom',
    title: 'Bedroom',
    pages: [/* bedroom controls */]
  },
  {
    id: 'kitchen',
    title: 'Kitchen',
    pages: [/* kitchen controls */]
  }
]
```

## Notes

- Configuration changes require a restart/rebuild of the application
- Database configuration loading has been removed in favor of file-based configuration
- All dashboard validation now applies to each dashboard individually
- The tile renderer now receives individual dashboard pages instead of the full dashboard array
