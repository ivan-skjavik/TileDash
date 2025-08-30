# Live Camera Feed Tile Guide

The Live Camera Feed Tile displays RTSP camera streams with camera switching capabilities and no Homey device dependency.

## Features

- ✅ **Multiple camera support**: Display multiple RTSP streams with easy switching
- ✅ **Camera selection buttons**: Header buttons to switch between cameras
- ✅ **Authentication support**: Username and password for secured cameras
- ✅ **None button**: Optional button to disable all streaming
- ✅ **Auto-start option**: Automatically start with first camera or stay off
- ✅ **Flexible video fitting**: Control how video displays within the tile
- ✅ **Loading and error states**: Visual feedback for connection status
- ✅ **No device dependency**: Pure streaming tile that doesn't require Homey connections

## Configuration

### Basic Configuration

```typescript
{
  type: 'LIVE_CAMERA_FEED',
  position: [0, 0],
  width: 4,
  height: 3,
  name: "Security Cameras",
  cameras: [
    {
      title: "Front Door",
      rtspUrl: "rtsp://192.168.1.100:554/stream1",
      username: "admin",
      password: "password123"
    },
    {
      title: "Back Yard", 
      rtspUrl: "rtsp://192.168.1.101:554/stream1"
    }
  ]
}
```

### Full Configuration

```typescript
TileFactory.createConfig('LIVE_CAMERA_FEED', {
  position: [0, 0],
  width: 4,
  height: 3,
  name: "Security System",
  cameras: [
    {
      title: "Front Door",
      rtspUrl: "rtsp://192.168.1.100:554/stream1",
      username: "admin",
      password: "password123"
    },
    {
      title: "Back Yard",
      rtspUrl: "rtsp://192.168.1.101:554/stream1", 
      username: "admin",
      password: "password123"
    },
    {
      title: "Garage",
      rtspUrl: "rtsp://192.168.1.102:554/stream1"
    }
  ],
  showCameraButtons: true,  // Show camera selection buttons
  showNoneButton: true,     // Include "None" button to stop streaming
  autoStart: false,         // Don't auto-start streaming
  objectFit: 'cover'        // How video fits in tile
})
```

## Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `cameras` | `CameraStream[]` | `[]` | **Required**: Array of camera configurations |
| `showCameraButtons` | `boolean` | `true` | Show camera selection buttons in header |
| `showNoneButton` | `boolean` | `true` | Include "None" button to disable streaming |
| `autoStart` | `boolean` | `true` | Auto-start with first camera on load |
| `objectFit` | `'cover' \| 'contain' \| 'fill'` | `'cover'` | How video should fit within the tile |

## Camera Stream Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | ✅ | Display name for the camera (shown on button) |
| `rtspUrl` | `string` | ✅ | RTSP stream URL |
| `username` | `string` | ❌ | Username for camera authentication |
| `password` | `string` | ❌ | Password for camera authentication |

## Object Fit Options

- **`cover`** (default): Video covers entire tile, may crop edges for aspect ratio
- **`contain`**: Video fits completely within tile, may show black bars
- **`fill`**: Video stretches to fill tile exactly (may distort aspect ratio)

## RTSP Stream Requirements

### Browser Compatibility Issue

**Important**: Modern web browsers do not natively support RTSP streams. You need additional infrastructure to convert RTSP to browser-compatible formats.

### Conversion Solutions

#### Option 1: HLS Conversion
```bash
# Using FFmpeg to convert RTSP to HLS
ffmpeg -i rtsp://camera-url -hls_time 2 -hls_playlist_type event stream.m3u8
```

#### Option 2: WebRTC Gateway
- **go2rtc**: Popular open-source RTSP to WebRTC gateway
- **Node Media Server**: JavaScript-based media server
- **Frigate**: Home Assistant integration with camera support

#### Option 3: RTSP Proxy Services
- **WebRTC-streamer**
- **RTSP-to-Web**
- **Live555 Proxy Server**

### URL Formats

```typescript
// Standard RTSP URL
"rtsp://192.168.1.100:554/stream1"

// With embedded authentication  
"rtsp://admin:password@192.168.1.100:554/stream1"

// Separate authentication (preferred for security)
{
  rtspUrl: "rtsp://192.168.1.100:554/stream1",
  username: "admin", 
  password: "password123"
}

// Alternative ports
"rtsp://camera.local:8554/live"
```

## Usage Examples

### Single Camera Setup
```typescript
{
  type: 'LIVE_CAMERA_FEED',
  position: [0, 0],
  width: 3,
  height: 2,
  name: "Front Door",
  cameras: [
    {
      title: "Main View",
      rtspUrl: "rtsp://doorbell.local:554/stream"
    }
  ],
  showCameraButtons: false, // Hide buttons for single camera
  showNoneButton: false,
  autoStart: true
}
```

### Multi-Camera Security System
```typescript
{
  type: 'LIVE_CAMERA_FEED',
  position: [0, 0],
  width: 5,
  height: 4,
  name: "Property Security",
  cameras: [
    {
      title: "Front",
      rtspUrl: "rtsp://192.168.1.10:554/main",
      username: "security",
      password: "securepass"
    },
    {
      title: "Back",
      rtspUrl: "rtsp://192.168.1.11:554/main", 
      username: "security",
      password: "securepass"
    },
    {
      title: "Side",
      rtspUrl: "rtsp://192.168.1.12:554/main",
      username: "security", 
      password: "securepass"
    },
    {
      title: "Garage",
      rtspUrl: "rtsp://192.168.1.13:554/main",
      username: "security",
      password: "securepass"
    }
  ],
  showCameraButtons: true,
  showNoneButton: true,
  autoStart: false,
  objectFit: 'cover'
}
```

### Pet/Baby Monitor
```typescript
{
  type: 'LIVE_CAMERA_FEED',
  position: [6, 0],
  width: 2,
  height: 2,
  name: "Baby Monitor",
  cameras: [
    {
      title: "Crib View",
      rtspUrl: "rtsp://babycam.local:554/stream"
    },
    {
      title: "Play Area", 
      rtspUrl: "rtsp://playcam.local:554/stream"
    }
  ],
  autoStart: true,
  objectFit: 'contain'
}
```

## Interaction

- **Camera buttons**: Click to switch between different cameras
- **None button**: Click to stop all streaming and show blank tile
- **Auto-switching**: Configurable auto-start behavior
- **Loading states**: Visual feedback during stream connection
- **Error handling**: Displays error messages for failed connections

## Network Considerations

### Bandwidth Usage
- RTSP streams can consume significant bandwidth
- Consider stream resolution and frame rate settings on cameras
- Multiple simultaneous streams multiply bandwidth requirements

### Local Network Setup
```typescript
// Recommended: Use local IP addresses for best performance
"rtsp://192.168.1.100:554/stream1"

// Avoid: External URLs may have higher latency
"rtsp://external-camera.example.com:554/stream" 
```

### Firewall Configuration
- Ensure RTSP port (typically 554) is open
- Configure camera network settings appropriately
- Consider VPN setup for external access

## Security Best Practices

1. **Separate Authentication**: Use `username`/`password` fields instead of embedding in URL
2. **Strong Passwords**: Use complex passwords for camera access
3. **Network Segmentation**: Place cameras on isolated network segment
4. **Regular Updates**: Keep camera firmware updated
5. **Access Control**: Limit dashboard access to authorized users

## Troubleshooting

### Common Issues

1. **"RTSP streams require media server conversion"**
   - Solution: Set up RTSP-to-HLS/WebRTC conversion
   - Check browser console for specific errors

2. **Authentication Failed**
   - Verify username/password credentials
   - Check camera user management settings
   - Try embedded authentication format

3. **Connection Timeout**
   - Verify camera IP address and port
   - Check network connectivity
   - Confirm camera is powered and running

4. **Stream Not Loading**
   - Test RTSP URL in VLC or similar player
   - Check camera stream settings
   - Verify supported codecs and formats

### Testing RTSP Streams
```bash
# Test with VLC Media Player
vlc rtsp://username:password@192.168.1.100:554/stream1

# Test with FFplay
ffplay rtsp://username:password@192.168.1.100:554/stream1

# Test with curl (for HTTP streams)
curl -I http://camera.local:8080/stream.m3u8
```

## Performance Optimization

- Use appropriate tile sizes for video resolution
- Configure cameras for optimal streaming settings
- Consider using lower resolution streams for dashboard display
- Implement stream transcoding if needed for bandwidth optimization

## Integration Notes

The tile automatically integrates with TileDash's:
- Theme system for consistent styling
- Loading states and error handling
- Responsive design patterns
- Touch/click interactions
- Hot module replacement for development
