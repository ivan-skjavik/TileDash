# RTSP Streaming Guide

This guide explains how the TileDash RTSP streaming functionality works with FFmpeg server-side conversion.

## Overview

The Live Camera Feed tile now supports real-time RTSP stream conversion using FFmpeg on the server. When you configure RTSP cameras, the server automatically converts them to HLS (HTTP Live Streaming) format that browsers can play natively.

## How It Works

1. **Client Request**: When a Live Camera Feed tile starts an RTSP stream, it sends a request to `/api/stream/start`
2. **Server Processing**: The server spawns an FFmpeg process to convert the RTSP stream to HLS segments
3. **HLS Delivery**: The converted stream is served as `.m3u8` playlist files with `.ts` segments
4. **Browser Playback**: The client plays the HLS stream using the native HTML5 video element

## Configuration

### Camera Configuration

```typescript
{
  type: 'LIVE_CAMERA_FEED',
  name: 'Security Cameras',
  cameras: [
    {
      title: 'Front Door',
      rtspUrl: 'rtsp://192.168.1.100:554/stream1',
      username: 'admin',        // Optional
      password: 'password123'   // Optional
    }
  ],
  quality: 'medium',  // 'low' | 'medium' | 'high' | 'ultra'
  autoStart: true,
  showCameraButtons: true,
  showNoneButton: true,
  objectFit: 'cover'
}
```

### Quality Presets

The system includes predefined quality presets for different network conditions:

| Preset | Resolution | Bitrate | FPS | Use Case |
|--------|-----------|---------|-----|----------|
| `low` | 640x480 | 500k | 15 | Low bandwidth, mobile |
| `medium` | 1280x720 | 1500k | 20 | Standard viewing |
| `high` | 1920x1080 | 3000k | 25 | High quality viewing |
| `ultra` | 1920x1080 | 6000k | 30 | Maximum quality |

## Server Endpoints

### Start Stream
```http
POST /api/stream/start
Content-Type: application/json

{
  "rtspUrl": "rtsp://camera.example.com/stream",
  "username": "admin",
  "password": "password",
  "quality": "medium"
}
```

Response:
```json
{
  "streamId": "abc123def456",
  "hlsUrl": "/hls/abc123def456.m3u8",
  "quality": {
    "resolution": "1280x720",
    "bitrate": "1500k",
    "fps": 20
  }
}
```

### Keep Stream Alive
```http
POST /api/stream/{streamId}/keepalive
```

### Stop Stream
```http
DELETE /api/stream/{streamId}
```

### List Active Streams
```http
GET /api/streams
```

### Get Quality Presets
```http
GET /api/quality-presets
```

## Stream Management

### Automatic Cleanup
- Streams automatically stop after 5 minutes of inactivity
- The client sends keep-alive signals every 30 seconds while actively viewing
- FFmpeg processes are properly terminated when streams end
- HLS segment files are automatically cleaned up

### Process Management
- Each stream runs in its own FFmpeg subprocess
- Processes are monitored for errors and automatically restarted if needed
- Graceful shutdown ensures no orphaned processes
- Memory usage is optimized with segment cleanup

## Requirements

### Server Requirements
- **FFmpeg**: Must be installed and available in system PATH
- **Node.js**: Version 14+ with ES modules support
- **Storage**: Temporary space for HLS segments (automatically cleaned)

### Network Requirements
- **RTSP Access**: Server must have network access to RTSP cameras
- **Firewall**: Ensure RTSP ports (usually 554) are accessible
- **Bandwidth**: Consider upload bandwidth for multiple concurrent streams

## Troubleshooting

### Common Issues

**FFmpeg Not Found**
```
Error: spawn ffmpeg ENOENT
```
Solution: Install FFmpeg and ensure it's in your system PATH.

**RTSP Connection Failed**
```
FFmpeg error: Connection refused
```
Solution: Check camera IP, port, and network connectivity.

**Authentication Failed**
```
FFmpeg error: 401 Unauthorized
```
Solution: Verify camera username and password.

**Stream Choppy/Buffering**
```
HLS segments loading slowly
```
Solution: Lower quality preset or check network bandwidth.

### Debug Mode

Enable verbose logging by setting environment variable:
```bash
DEBUG=tiledash:streaming
```

This will show detailed FFmpeg output and stream management logs.

### Performance Tuning

For multiple concurrent streams:

1. **Quality Settings**: Use appropriate quality presets
2. **Hardware Acceleration**: Configure FFmpeg with GPU encoding if available
3. **Network Optimization**: Ensure sufficient bandwidth and low latency
4. **Storage**: Use SSD for temporary HLS file storage

## Example Configuration

```typescript
// config.ts
export const CAMERA_TILE_CONFIG = {
  type: 'LIVE_CAMERA_FEED',
  name: 'Security System',
  cameras: [
    {
      title: 'Front Entrance',
      rtspUrl: 'rtsp://192.168.1.101:554/stream1',
      username: 'admin',
      password: 'securepass123'
    },
    {
      title: 'Back Yard',
      rtspUrl: 'rtsp://192.168.1.102:554/stream1',
      username: 'admin',
      password: 'securepass123'
    },
    {
      title: 'Garage',
      rtspUrl: 'rtsp://192.168.1.103:554/stream1'
      // No auth required for this camera
    }
  ],
  quality: 'high',
  autoStart: true,
  objectFit: 'cover'
};
```

## Advanced Configuration

### Custom FFmpeg Parameters

You can extend the server to support custom FFmpeg parameters by modifying the `buildFFmpegArgs` method in `StreamManager`.

### Authentication Methods

The system supports URL-based authentication. For other methods (like separate auth endpoints), extend the `StreamConfig` interface and modify the stream start logic.

### Streaming Protocols

Currently supports:
- ✅ RTSP over TCP
- ✅ RTSP over UDP (default)
- ✅ HTTP streams (direct passthrough)
- ⚠️ RTMP (requires FFmpeg RTMP support)
- ❌ WebRTC (would require different approach)

## Security Considerations

- Credentials are handled server-side and not exposed to clients
- HLS segments are served with proper CORS headers
- Stream IDs are generated to prevent unauthorized access
- Automatic cleanup prevents resource exhaustion attacks
- No persistent storage of credentials or stream data
