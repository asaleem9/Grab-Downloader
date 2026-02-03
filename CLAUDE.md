# Meow Project - Cobalt Media Downloader

## Project Overview

This directory contains a local cobalt instance for media downloading from various platforms including YouTube, Twitter, TikTok, etc.

### Directory Structure
```
/Users/meeko/Desktop/meow/
└── cobalt/                    # Main cobalt application (fork: asaleem9/cobalt, branch: meowing.de)
    ├── api/                   # Backend API server (port 9000)
    └── web/                   # Frontend web UI (port 5173)
```

## Running Cobalt

### Start the API server
```bash
cd /Users/meeko/Desktop/meow/cobalt/api
pnpm start
# Logs to stdout, can redirect: pnpm start > /tmp/api.log 2>&1
```

### Start the Web UI
```bash
cd /Users/meeko/Desktop/meow/cobalt/web
pnpm dev
```

### Access Points
- **Web UI**: https://localhost:5173/
- **API**: http://localhost:9000/
- **Internal Tunnel**: 127.0.0.1:65432

## YouTube Token Generation

### How It Works
Cobalt uses `bgutils-js` to automatically generate YouTube `poToken` and `visitor_data` tokens. This is controlled by the `YOUTUBE_GENERATE_PO_TOKENS` environment variable (defaults to enabled).

### Environment Variables (api/.env)
```bash
API_URL=http://localhost:9000/
API_PORT=9000
CORS_WILDCARD=1

# YouTube-specific (optional - defaults work fine)
# YOUTUBE_GENERATE_PO_TOKENS=1          # Default: enabled (use bgutils-js)
# YOUTUBE_SESSION_SERVER=http://localhost:8080/  # External session server (not needed)
# YOUTUBE_SESSION_INNERTUBE_CLIENT=WEB_EMBEDDED
# CUSTOM_INNERTUBE_CLIENT=WEB_EMBEDDED
```

### yt-session-generator (Alternative Method - Not Needed)
Cobalt's built-in bgutils-js handles token generation automatically. The external `yt-session-generator` is not required.

If you ever need it in the future: https://github.com/imputnet/yt-session-generator
- Requires Python 3.9+ and Chrome/Chromium
- Has known issues with macOS Chrome connections (sandbox/headless mode)

## Troubleshooting

### "file tunnel is empty" Error
This YouTube error typically means token generation failed. Solutions:
1. Restart the API server - tokens refresh on restart
2. Check if `YOUTUBE_GENERATE_PO_TOKENS` is not set to "0"
3. Verify internet connectivity (tokens require external API calls)

### Testing YouTube Downloads
```bash
# Direct API test
curl -X POST 'http://localhost:9000/' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'

# Should return: {"status":"tunnel","url":"http://localhost:9000/tunnel?...","filename":"..."}
```

### Check Running Processes
```bash
ps aux | grep -E "node.*cobalt|pnpm" | grep -v grep
lsof -i :9000   # API port
lsof -i :5173   # Web UI port
```

## API Response Format

### Successful Response
```json
{
  "status": "tunnel",
  "url": "http://localhost:9000/tunnel?id=...&exp=...&sig=...&sec=...&iv=...",
  "filename": "Video Title (quality, codec).mp4"
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "error.code.here"
  }
}
```

## Cookies

Cobalt supports cookies for authenticated downloads. Cookie file location is configured in the API. Check `api/src/core/env.js` for `cookiePath` configuration.

## Notes

- The cobalt instance is a fork from `asaleem9/cobalt` on branch `meowing.de`
- Version: 11.5
- Web UI uses Vite dev server with HTTPS on localhost
- API uses internal tunnel handler for streaming downloads
