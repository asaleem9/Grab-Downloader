# Grab

A full-stack media downloading application built to explore modern web development patterns, streaming architectures, and cloud deployment strategies.

## About This Project

This project represents my journey into understanding how large-scale media processing applications work under the hood. Rather than just using existing tools, I wanted to dig into the complexities of:

- Building performant streaming proxies
- Handling encrypted tunnel architectures
- Deploying containerized applications to cloud infrastructure
- Creating responsive, accessible web interfaces

The result is **Grab** — a web application that extracts and downloads media from various platforms, processing everything through encrypted tunnels without ever storing user data.

## Technology Stack

### Frontend (`/web`)

| Technology | Purpose |
|------------|---------|
| **SvelteKit** | Full-stack framework with SSR/SSG capabilities |
| **TypeScript** | Type-safe development across the codebase |
| **Vite** | Lightning-fast HMR and optimized production builds |
| **Caddy** | Production web server with automatic HTTPS |

The frontend is built as a static site that communicates with the API backend. Key architectural decisions:

- **Reactive State Management**: Leveraging Svelte's built-in reactivity with stores for global state (settings, dialogs, queue management)
- **i18n Architecture**: JSON-based translations with markdown support for long-form content
- **Progressive Web App**: Full PWA support with offline capabilities and installability
- **Web Workers**: Heavy processing (FFmpeg transcoding, file fetching) runs in dedicated workers to keep the UI responsive

### Backend (`/api`)

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express** | HTTP server and routing |
| **FFmpeg** | Media processing, remuxing, and transcoding |
| **youtubei.js** | YouTube innertube API client |

The API handles the complex work of extracting media URLs from various platforms and streaming content through encrypted tunnels.

#### Streaming Architecture

The most interesting part of this project is the tunnel system:

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌─────────────┐
│  User   │────▶│   Web   │────▶│   API        │────▶│   Source    │
│ Browser │◀────│ Frontend│◀────│   Server     │◀────│   Platform  │
└─────────┘     └─────────┘     └──────────────┘     └─────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Encrypted       │
                              │  Tunnel Cache    │
                              │  (90s TTL, RAM)  │
                              └──────────────────┘
```

1. **Request Processing**: User submits a URL → API parses and routes to the appropriate service handler
2. **Media Extraction**: Service-specific logic extracts direct media URLs
3. **Tunnel Creation**: API generates an encrypted tunnel with AES-256, storing metadata in RAM for 90 seconds
4. **Streaming**: Media streams through the tunnel directly to the user — nothing touches disk

#### Service Handler Pattern

Each supported platform has a dedicated handler in `/api/src/processing/services/`:

```javascript
// Simplified handler structure
export default async function(obj) {
    const { url, quality, format } = obj;

    // 1. Fetch page/API data
    // 2. Parse media information
    // 3. Select appropriate quality/format
    // 4. Return stream URL or tunnel request

    return {
        urls: mediaUrl,
        filename: generatedFilename,
        audioFilename: audioFile  // for split audio/video
    };
}
```

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Google Cloud Run** | Serverless container hosting |
| **Artifact Registry** | Container image storage |
| **Cloud Build** | CI/CD pipeline |

Deployed with free-tier optimization:
- Scale-to-zero configuration
- CPU throttling when idle
- Minimal memory allocation
- Single instance maximum

## Project Structure

```
├── api/                    # Backend API server
│   ├── src/
│   │   ├── core/          # Express app, environment config
│   │   ├── processing/    # URL matching, service handlers
│   │   ├── stream/        # Tunnel management, FFmpeg processing
│   │   └── security/      # JWT, API keys, Turnstile integration
│   └── Dockerfile
│
├── web/                    # Frontend application
│   ├── src/
│   │   ├── components/    # Svelte components
│   │   ├── lib/           # Utilities, state management, API clients
│   │   ├── routes/        # SvelteKit file-based routing
│   │   └── fonts/         # Custom typography
│   ├── i18n/              # Internationalization files
│   ├── static/            # Static assets, PWA manifest
│   └── Dockerfile
│
├── packages/              # Shared packages
│   ├── api-client/        # TypeScript API client
│   └── version-info/      # Version utilities
│
└── docs/                  # Documentation
```

## Key Learning Areas

### 1. Streaming & Proxying

Understanding how to efficiently proxy large media files without buffering entire files in memory. The tunnel system uses Node.js streams to pipe data directly from source to client.

### 2. Encryption at Rest (in RAM)

Even temporary data in the tunnel cache is encrypted. The decryption key only exists in the URL given to the user — the server cannot decrypt cached data without it.

### 3. Platform-Specific Extraction

Each platform (YouTube, Twitter, TikTok, etc.) has unique challenges:
- **YouTube**: Requires session tokens (poToken) and innertube client spoofing
- **Twitter/X**: GraphQL API navigation with guest tokens
- **TikTok**: User-agent rotation and regional handling

### 4. Web Worker Architecture

The frontend offloads CPU-intensive work to Web Workers:
- `cobaltFetchWorker`: Handles chunked downloads with progress tracking
- `cobaltFFmpegWorker`: Client-side media processing using FFmpeg WASM

### 5. Cloud-Native Deployment

Building containers that work well in serverless environments:
- Fast cold starts (< 10s)
- Stateless design
- Environment-based configuration
- Health check endpoints

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm
- FFmpeg (for API)

### Development

```bash
# Install dependencies
pnpm install

# Start API (terminal 1)
cd api && pnpm start

# Start Web (terminal 2)
cd web && pnpm dev
```

### Environment Variables

**API (`api/.env`)**:
```bash
API_URL=http://localhost:9000/
API_PORT=9000
CORS_WILDCARD=1
```

**Web** (build-time via Vite):
```bash
WEB_DEFAULT_API=http://localhost:9000/
```

## Deployment

The project includes Cloud Build configurations for GCP deployment:

```bash
# Build and deploy API
gcloud builds submit --config=cloudbuild-api.yaml

# Build and deploy Web
gcloud builds submit --config=cloudbuild-web.yaml
```

See `cloudbuild-api.yaml` and `cloudbuild-web.yaml` for the full CI/CD configuration.

## Acknowledgments

This project is built upon [cobalt](https://github.com/imputnet/cobalt), an open-source media downloader. The cobalt team's work provided the foundation for understanding media extraction patterns and streaming architectures.

- API code: [AGPL-3.0](https://github.com/imputnet/cobalt/blob/main/LICENSE)
- Frontend code: [CC-BY-NC-SA 4.0](https://github.com/imputnet/cobalt/blob/main/web/LICENSE)

---

*Built as a learning project to explore full-stack development, streaming systems, and cloud infrastructure.*
