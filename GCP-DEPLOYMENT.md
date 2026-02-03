# GCP Deployment Guide - YouTube Fix

## The Problem

YouTube aggressively blocks datacenter IPs (like those from GCP, AWS, Azure). Even with the TV_SIMPLY client and Onesie API enabled, you may experience:
- "file tunnel is empty" errors
- Rate limiting
- Random video failures

## Required Environment Variables

These must be set regardless of where you deploy:

```bash
CUSTOM_INNERTUBE_CLIENT=TV_SIMPLY
YOUTUBE_GENERATE_PO_TOKENS=1
YOUTUBE_USE_ONESIE=1
```

| Variable | Purpose |
|----------|---------|
| `CUSTOM_INNERTUBE_CLIENT=TV_SIMPLY` | Uses TV client with less strict bot detection |
| `YOUTUBE_GENERATE_PO_TOKENS=1` | Enables poToken generation via bgutils-js |
| `YOUTUBE_USE_ONESIE=1` | Uses YouTube's TV streaming API |

## Solution: Cloudflare WARP via Gluetun

Cloudflare WARP (free) routes traffic through Cloudflare's network, which has better IP reputation than raw datacenter IPs.

### Docker Compose Setup

```yaml
services:
  gluetun:
    image: qmcgaw/gluetun
    container_name: gluetun
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    environment:
      - VPN_SERVICE_PROVIDER=cloudflare
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=  # Leave empty for auto-generation
      - WARP_MODE=proxy
    ports:
      - 8888:8888/tcp  # HTTP proxy
    restart: unless-stopped

  cobalt-api:
    image: ghcr.io/imputnet/cobalt:latest  # or your custom image
    container_name: cobalt-api
    environment:
      - API_URL=https://your-domain.com/
      - API_PORT=9000
      - CORS_WILDCARD=0
      - CORS_URL=https://your-domain.com
      - CUSTOM_INNERTUBE_CLIENT=TV_SIMPLY
      - YOUTUBE_GENERATE_PO_TOKENS=1
      - YOUTUBE_USE_ONESIE=1
      - HTTP_PROXY=http://gluetun:8888
      - HTTPS_PROXY=http://gluetun:8888
    ports:
      - 9000:9000
    depends_on:
      - gluetun
    restart: unless-stopped

  cobalt-web:
    image: ghcr.io/imputnet/cobalt:latest  # web image
    container_name: cobalt-web
    environment:
      - WEB_URL=https://your-domain.com
      - API_URL=https://your-domain.com/  # point to your API
    ports:
      - 3000:3000
    restart: unless-stopped
```

### GCP-Specific Notes

1. **Firewall Rules**: Ensure ports 9000 (API) and 3000 (web) are open
2. **VPC**: Gluetun needs `/dev/net/tun` - use a VM, not Cloud Run
3. **Compute Engine**: Works well with e2-micro or larger
4. **Cloud Run**: Won't work with gluetun (no TUN device access)

### Alternative: Network Mode

Instead of HTTP proxy, you can route all cobalt traffic through gluetun:

```yaml
services:
  gluetun:
    # ... same as above, but remove ports

  cobalt-api:
    network_mode: "service:gluetun"
    # ... rest of config, but ports go on gluetun instead
```

## Alternative Solutions

### Residential Proxy (Paid)

If WARP isn't sufficient, use a residential proxy service:

```bash
HTTP_PROXY=http://user:pass@proxy.example.com:8080
HTTPS_PROXY=http://user:pass@proxy.example.com:8080
```

Services to consider:
- Bright Data
- Oxylabs
- IPRoyal
- Smartproxy

### IPv6

YouTube is sometimes less strict on IPv6. If your GCP setup supports it:
1. Enable IPv6 on your VPC
2. Ensure cobalt can reach YouTube over IPv6
3. May help with rate limiting

## Testing

After deployment, test with:

```bash
curl -X POST 'https://your-domain.com/' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'
```

Expected response:
```json
{"status":"tunnel","url":"...","filename":"..."}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "file tunnel is empty" | Check WARP is running: `docker logs gluetun` |
| Timeouts | Verify proxy connectivity from cobalt container |
| Rate limiting | Consider adding delays or using residential proxy |
| Videos work locally but not on GCP | Confirms it's an IP reputation issue - WARP should help |
