# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the API server
pnpm start

# Start the web frontend (from ../web directory)
cd ../web && pnpm dev

# Run all service tests
pnpm test

# Run tests for a specific service
node src/util/test run-tests-for <service>
# Example: node src/util/test run-tests-for youtube

# List all testable services
node src/util/test get-services

# Generate a JWT secret
pnpm token:jwt

# Test API response (useful for debugging)
curl -X POST 'http://localhost:9000/' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'
```

## Environment Configuration

The API requires a `.env` file in the `api/` directory. Minimum required:

```bash
API_URL=http://localhost:9000/   # MUST match where API is accessible (used for tunnel URLs)
API_PORT=9000
CORS_WILDCARD=1                  # Enable CORS for local development
```

**Critical:** `API_URL` must point to the API server, not a web frontend. Tunnel URLs are constructed from this value.

### YouTube-Specific Configuration

For YouTube downloads to work reliably:

```bash
CUSTOM_INNERTUBE_CLIENT=TV_SIMPLY    # Less aggressive bot detection than IOS
YOUTUBE_GENERATE_PO_TOKENS=1          # Enable poToken generation via bgutils-js
YOUTUBE_USE_ONESIE=1                  # Use YouTube TV streaming API
```

## Project Structure

This is the **API backend** (`api/`). The web frontend lives in `../web/` and connects to this API. Both must be running for full functionality:
- API: http://localhost:9000
- Web: https://localhost:5173

## Architecture

### Request Flow

1. **Entry Point** (`src/cobalt.js`): Initializes Express app, loads environment
2. **API Layer** (`src/core/api.js`): HTTP endpoints, rate limiting, CORS, request validation
3. **URL Matching** (`src/processing/match.js`): Routes requests to service handlers based on URL patterns
4. **Service Handlers** (`src/processing/services/*.js`): Platform-specific extraction logic (youtube.js, twitter.js, tiktok.js, etc.)
5. **Stream Management** (`src/stream/manage.js`): Creates encrypted tunnel URLs for media delivery
6. **Stream Delivery** (`src/stream/stream.js`): Routes to proxy, ffmpeg remux/convert, or internal stream

### Key Subsystems

**Service Configuration** (`src/processing/service-config.js`, `src/processing/service-patterns.js`):
- Defines URL patterns per service using `url-pattern` library
- Each service has patterns, optional subdomains, alt domains, and TLD overrides

**Tunnel System**:
- `createStream()` in `src/stream/manage.js` creates encrypted tunnel URLs
- Tunnels store stream metadata in cache (memory or Redis)
- `/tunnel` endpoint verifies HMAC signature and decrypts stream info
- Internal tunnels (`/itunnel`) handle localhost streaming for ffmpeg

**YouTube Handling** (`src/processing/services/youtube.js`, `src/processing/helpers/youtube-*.js`):
- Uses `youtubei.js` library for innertube API access
- `youtube-onesie.js`: TV client streaming API (bypasses some restrictions)
- `youtube-po.js`: poToken generation via bgutils-js
- `youtube-session.js`: External session server support

**FFmpeg Processing** (`src/stream/ffmpeg.js`):
- Handles merge (video+audio), remux, audio conversion, GIF conversion
- Uses internal tunnels to stream source files to ffmpeg

### Environment Loading

`src/core/env.js` handles environment variable parsing with support for:
- Hot-reloading via `API_ENV_FILE`
- Subscription system for env change callbacks
- Proxy variable forwarding to `process.env` for undici

### Storage

`src/store/` provides pluggable storage backends:
- `memory-store.js`: Default in-memory cache
- `redis-store.js`: Redis backend for multi-instance deployments

## Adding a New Service

1. Add URL patterns to `src/processing/service-config.js`
2. Add pattern tester to `src/processing/service-patterns.js`
3. Create handler in `src/processing/services/<service>.js`
4. Add case in `src/processing/match.js` switch statement
5. Add test cases in `src/util/tests/<service>.json`

## Testing Notes

Tests use JSON fixtures in `src/util/tests/`. Some services (youtube, twitter, instagram, etc.) are marked as "finnicky" and failures are ignored by default due to rate limiting. Override with:

```bash
TEST_IGNORE_SERVICES=service1,service2 pnpm test
```
