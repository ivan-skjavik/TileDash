# SCSS Support in TileDash

TileDash now supports SCSS (Sass) for writing more maintainable and organized styles. This document explains how to use SCSS in the project.

## What's Included

### 1. Sass Package
- **sass** package installed as a dev dependency
- Vite has built-in support for SCSS compilation
- No additional configuration needed for basic SCSS features

### 2. SCSS Architecture
The project includes a structured SCSS architecture:

```
src/styles/
├── _variables.scss      # SCSS variables (colors, spacing, breakpoints)
├── _mixins.scss        # Reusable mixins
├── main.scss          # Main entry point (imports all modules)
├── test-scss.scss     # Test file for SCSS features
├── base/
│   ├── _reset.scss     # CSS reset and normalize
│   ├── _typography.scss # Typography styles
│   └── _layout.scss    # Layout utilities
├── components/
│   ├── _tiles.scss     # Tile component styles
│   ├── _dashboard.scss # Dashboard component styles
│   ├── _header.scss    # Header component styles
│   └── _navigation.scss # Navigation component styles
├── themes/
│   ├── _light.scss     # Light theme styles
│   └── _dark.scss      # Dark theme styles
└── utilities/
    ├── _helpers.scss   # Utility classes
    └── _animations.scss # Animation utilities
```

## How to Use SCSS

### 1. Basic Usage
Create SCSS files with `.scss` extension and import them in your TypeScript files:

```typescript
// In main.ts or any component file
import './styles/my-styles.scss';
```

### 2. Using Variables
Variables are defined in `_variables.scss`:

```scss
// Using variables
.my-component {
  background: $primary-color;
  padding: $spacing-md;
  border-radius: $tile-border-radius;
}
```

### 3. Using Mixins
Mixins are defined in `_mixins.scss`:

```scss
// Using mixins
@use 'variables' as *;
@use 'mixins' as *;

.centered-content {
  @include flex-center;
  padding: $spacing-lg;
}

.responsive-text {
  @include tablet-up {
    font-size: $font-size-large;
  }
}
```

### 4. Nesting
SCSS allows CSS rule nesting:

```scss
.tile {
  background: $surface-color;
  transition: all $transition-normal;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $tile-shadow-hover;
  }
  
  &__icon {
    font-size: 24px;
    color: $primary-color;
  }
  
  &--active {
    background: $primary-color;
    color: white;
  }
}
```

## Available Variables

### Colors
```scss
$primary-color: #1976d2;
$secondary-color: #424242;
$accent-color: #ff4081;
$background-color: #fafafa;
$surface-color: #ffffff;
// ... and more
```

### Spacing
```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-xxl: 48px;
```

### Typography
```scss
$font-family-primary: 'Roboto', sans-serif;
$font-size-base: 14px;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-bold: 700;
```

### Breakpoints
```scss
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1200px;
```

## Available Mixins

### Layout Mixins
```scss
@include flex-center;         // Centers content with flexbox
@include flex-between;        // Space-between with flexbox
@include flex-column;         // Flex column direction
@include flex-column-center;  // Flex column with centered content
```

### Responsive Mixins
```scss
@include mobile-only { ... }      // Styles for mobile only
@include tablet-up { ... }        // Styles for tablet and up
@include desktop-up { ... }       // Styles for desktop and up
@include large-desktop-up { ... } // Styles for large desktop and up
```

### Tile Mixins
```scss
@include tile-base;                    // Base tile styles
@include tile-size(2, 1);             // Set tile width and height
@include tile-position(0, 1);         // Set tile position
```

### Button Mixins
```scss
@include button-base;        // Base button styles
@include button-primary;     // Primary button styles
@include button-secondary;   // Secondary button styles
```

### Utility Mixins
```scss
@include text-truncate;           // Truncate text with ellipsis
@include text-clamp(3);          // Clamp text to 3 lines
@include loading-spinner;        // Add loading spinner
@include shadow-sm;              // Small shadow
@include shadow-md;              // Medium shadow
@include shadow-lg;              // Large shadow
```

## Component Example

Here's an example of creating a styled component with SCSS:

```scss
// my-component.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.my-component {
  @include flex-center;
  background: $surface-color;
  border-radius: $tile-border-radius;
  padding: $spacing-md;
  box-shadow: $tile-shadow;
  transition: all $transition-normal;
  
  &:hover {
    @include hover-lift;
  }
  
  &__title {
    font-size: $font-size-large;
    font-weight: $font-weight-medium;
    color: $primary-color;
    margin-bottom: $spacing-sm;
    @include text-truncate;
  }
  
  &__content {
    color: $secondary-color;
    
    @include tablet-up {
      font-size: $font-size-base;
    }
  }
  
  &--featured {
    background: $primary-color;
    color: white;
    
    .my-component__title {
      color: white;
    }
  }
}
```

## Best Practices

### 1. Use @use instead of @import
```scss
// ✅ Good - Modern Sass syntax
@use 'variables' as *;
@use 'mixins' as *;

// ❌ Avoid - Deprecated syntax
@import 'variables';
@import 'mixins';
```

### 2. Import Variables and Mixins in Each File
```scss
// At the top of each .scss file that uses variables or mixins
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;
```

### 3. Use Semantic Class Names
```scss
// ✅ Good - BEM methodology
.tile {
  &__icon { ... }
  &__title { ... }
  &--active { ... }
}

// ❌ Avoid - Generic class names
.blue { ... }
.big { ... }
```

### 4. Organize by Component
Create separate SCSS files for each component and import them as needed.

### 5. Use Variables for Consistency
```scss
// ✅ Good - Use variables
padding: $spacing-md;
color: $primary-color;

// ❌ Avoid - Magic numbers
padding: 16px;
color: #1976d2;
```

## Migration from CSS

To migrate existing CSS files to SCSS:

1. Rename `.css` files to `.scss`
2. Replace hard-coded values with variables
3. Use nesting for related styles
4. Extract common patterns into mixins
5. Update import statements in TypeScript files

## Troubleshooting

### Common Issues

1. **"Undefined variable" error**: Make sure to import variables at the top of your SCSS file
2. **"Undefined mixin" error**: Make sure to import mixins at the top of your SCSS file
3. **Import path errors**: Use the `@/styles/` alias for importing from the styles directory

### Performance Tips

- Avoid deep nesting (max 3-4 levels)
- Use specific imports instead of importing entire libraries
- Minimize the use of complex calculations in SCSS

## Building and Development

- SCSS files are automatically compiled by Vite during development
- Source maps are enabled for debugging
- Hot module replacement (HMR) works with SCSS changes
- Production builds automatically optimize and minify SCSS output
