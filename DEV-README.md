# TileDash Development Setup

This project has been enhanced with modern development tools including TypeScript, hot-reload, SQLite database, and pnpm package management.

## Prerequisites

- Node.js (v16 or higher)
- pnpm (install with `npm install -g pnpm`)

## Installation

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Start development server with hot-reload
pnpm dev
```

This will:
- Start Vite development server with hot-reload on port 3000
- Start TypeScript compiler in watch mode
- Open your browser automatically

## Production

```bash
# Build for production
pnpm build

# Preview production build
pnpm serve
```

## Database

The project uses SQLite for local data storage:

```bash
# Initialize/migrate database
pnpm db:migrate

# Seed database with sample data
pnpm db:seed
```

## Scripts

- `pnpm dev` - Start development server with hot-reload
- `pnpm serve` - Start production preview server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with initial data

## Project Structure

```
├── src/                    # TypeScript source files
│   ├── main.ts            # Main application entry point
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # Utility functions
│   └── database.ts        # Database setup and queries
├── js/                    # Original JavaScript files
├── css/                   # Stylesheets
├── img/                   # Images and assets
├── db/                    # SQLite database files
├── scripts/               # Build and utility scripts
├── dashboard.js           # Dashboard configuration
├── index.html             # Main HTML file
├── vite.config.js         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── server.js              # Development API server
```

## Features

### TypeScript Support
- Full TypeScript integration with type definitions for TileDash
- Type checking and IntelliSense support
- Automatic compilation with watch mode

### Hot Reload
- Instant updates when you modify files
- Preserves application state during development
- Works with HTML, CSS, JavaScript, and TypeScript files

### SQLite Database
- Local database for storing dashboard configurations
- Device state logging and history
- Automatic cleanup of old logs

### Modern Development Tools
- Vite for fast development server and building
- ESLint for code quality
- Concurrent script execution
- Path aliases for cleaner imports

### API Endpoints

The development server includes these API endpoints:

- `GET /api/dashboard/config` - Get active dashboard configuration
- `POST /api/dashboard/config` - Save dashboard configuration
- `POST /api/devices/log` - Log device state changes
- `GET /api/devices/:deviceId/history` - Get device history
- `GET /api/settings/:key` - Get setting value
- `PUT /api/settings/:key` - Set setting value
- `GET /api/health` - Health check

## Configuration

The dashboard can be configured through:

1. **Environment Variables** - Create a `.env` file (see `.env.example`)
2. **dashboard.js** - Traditional configuration file
3. **Database** - Stored configurations via API
4. **URL parameters** - Override settings like `?theme=smooth-dark&orientation=portrait`

### Token Authentication Priority

The application checks for tokens in this order:

1. **Environment Variable** - `HOMEY_TOKEN` in `.env` file (highest priority)
2. **URL Parameter** - `?token=your_token` in the URL (fallback)

To use environment-based authentication:

1. Copy `.env.example` to `.env`
2. Set `HOMEY_TOKEN=your_actual_token`
3. Restart the development server

This is more secure than having tokens in URLs and is perfect for development.

## Themes

Supported themes:
- `tiledash` (default)
- `smooth-light`
- `smooth-dark`

Change theme via URL parameter: `?theme=smooth-dark`

## Browser Support

- Modern browsers with ES2020 support
- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+
