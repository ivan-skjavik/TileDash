import { TileFactory } from '@/services/TileFactory';

/**
 * Example configuration for Live Camera Feed Tiles
 * 
 * This file demonstrates various ways to configure the new LIVE_CAMERA_FEED tile type.
 * Copy and modify these examples for your own dashboard configuration.
 */

// Example 1: Basic security cameras with authentication
export const securityCameras = TileFactory.createConfig( 'LIVE_CAMERA_FEED', {
	position: [ 0, 0, ],
	width: 4,
	height: 3,
	name: "Security Cameras",
	cameras: [
		{
			title: "Front Door",
			rtspUrl: "rtsp://192.168.1.100:554/stream1",
			username: "admin",
			password: "password123",
		},
		{
			title: "Back Yard",
			rtspUrl: "rtsp://192.168.1.101:554/stream1",
			username: "admin", 
			password: "password123",
		},
		{
			title: "Garage",
			rtspUrl: "rtsp://192.168.1.102:554/stream1",
			username: "admin",
			password: "password123",
		},
	],
	showCameraButtons: true,
	showNoneButton: true,
	autoStart: false,
	objectFit: 'cover',
} );

// Example 2: Simple cameras without authentication
export const simpleCameras = TileFactory.createConfig( 'LIVE_CAMERA_FEED', {
	position: [ 4, 0, ],
	width: 3,
	height: 2,
	name: "Pet Cams",
	cameras: [
		{
			title: "Living Room",
			rtspUrl: "rtsp://192.168.1.200:554/live",
		},
		{
			title: "Kitchen",
			rtspUrl: "rtsp://192.168.1.201:554/live",
		},
	],
	showCameraButtons: true,
	showNoneButton: false, // No "None" button
	autoStart: true,       // Auto-start with first camera
	objectFit: 'contain',
} );

// Example 3: Single camera with minimal UI
export const singleCamera = TileFactory.createConfig( 'LIVE_CAMERA_FEED', {
	position: [ 7, 0, ],
	width: 2,
	height: 2,
	name: "Main Entrance",
	cameras: [
		{
			title: "Entrance",
			rtspUrl: "rtsp://192.168.1.150:554/main",
			username: "viewer",
			password: "viewpass",
		},
	],
	showCameraButtons: false, // Hide camera buttons for single camera
	showNoneButton: false,
	autoStart: true,
	objectFit: 'cover',
} );

// Example 4: Multi-location cameras
export const multiLocationCameras = TileFactory.createConfig( 'LIVE_CAMERA_FEED', {
	position: [ 0, 3, ],
	width: 5,
	height: 4,
	name: "Property Overview",
	cameras: [
		{
			title: "Front",
			rtspUrl: "rtsp://cam1.example.com:554/stream",
			username: "user",
			password: "pass",
		},
		{
			title: "Side",
			rtspUrl: "rtsp://cam2.example.com:554/stream",
			username: "user",
			password: "pass",
		},
		{
			title: "Back",
			rtspUrl: "rtsp://cam3.example.com:554/stream",
			username: "user",
			password: "pass",
		},
		{
			title: "Driveway",
			rtspUrl: "rtsp://cam4.example.com:554/stream",
			username: "user",
			password: "pass",
		},
		{
			title: "Pool",
			rtspUrl: "rtsp://cam5.example.com:554/stream",
			username: "user",
			password: "pass",
		},
	],
	showCameraButtons: true,
	showNoneButton: true,
	autoStart: false,
	objectFit: 'cover',
} );

// Example 5: Compact camera tile
export const compactCamera = TileFactory.createConfig( 'LIVE_CAMERA_FEED', {
	position: [ 8, 2, ],
	width: 2,
	height: 1,
	// No name - more space for video
	cameras: [
		{
			title: "Doorbell",
			rtspUrl: "rtsp://doorbell.local:554/stream",
		},
		{
			title: "Mailbox",
			rtspUrl: "rtsp://mailbox.local:554/stream",
		},
	],
	showCameraButtons: true,
	showNoneButton: true,
	autoStart: true,
	objectFit: 'cover',
} );

/**
 * RTSP Stream Configuration Notes:
 * 
 * 1. RTSP URLs typically follow the format: rtsp://[username:password@]host[:port]/path
 * 2. Common RTSP ports: 554 (default), 8554
 * 3. Authentication can be provided in URL or separate username/password fields
 * 4. For web browser compatibility, RTSP streams usually need conversion to:
 *    - HLS (HTTP Live Streaming)
 *    - WebRTC
 *    - MPEG-DASH
 * 
 * Popular RTSP-to-Web solutions:
 * - Node Media Server
 * - FFmpeg with HLS output
 * - WebRTC gateway services
 * - Frigate (for Home Assistant)
 * - go2rtc
 */

/**
 * Usage in your main config.ts:
 * 
 * import { securityCameras, simpleCameras } from './examples/live-camera-examples';
 * 
 * export const appConfig: AppConfig = {
 *   dashboards: [{
 *     pages: [{
 *       tiles: [
 *         securityCameras,
 *         simpleCameras,
 *         // ... other tiles
 *       ]
 *     }]
 *   }]
 * };
 */
