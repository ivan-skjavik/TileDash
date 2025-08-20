import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig( {
	root: '.',
	publicDir: 'public',
	server: {
		port: 3000,
		host: true,
		open: true,
		hmr: true,
		watch: {
			usePolling: true,
		},
		proxy: {
			'/api': {
				target: 'http://localhost:3012',
				changeOrigin: true,
				secure: false,
			},
			'/auth': {
				target: 'http://localhost:3012',
				changeOrigin: true,
				secure: false,
			},
		},
	},
	preview: {
		port: 4173,
		host: true,
	},
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		rollupOptions: {
			input: {
				main: resolve( __dirname, 'index.html' ),
			},
		},
	},
	resolve: {
		alias: {
			'@': resolve( __dirname, './src' ),
			'@js': resolve( __dirname, './js' ),
			'@css': resolve( __dirname, './css' ),
			'@img': resolve( __dirname, './img' ),
		},
	},
	css: {
		devSourcemap: true,
		preprocessorOptions: {
			scss: {
				silenceDeprecations: [ 'legacy-js-api', ],
			},
		},
	},
	esbuild: {
		target: 'es2020',
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV || 'development' ),
	},
} );
