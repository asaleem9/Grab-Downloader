# GCP Deployment Guide - YouTube Fix

## The Problem

YouTube blocks datacenter IPs (GCP, AWS, Azure). Requests from a flagged IP
with no bot-evasion signals get `error.api.youtube.login` — the
"sign in to confirm you're not a bot" challenge. The same video downloads fine
from a residential IP.

## The Fix (verified on this Cloud Run deployment)

**Setting the three YouTube env vars below is what beats the challenge.** They
make requests present as the TV client with a generated poToken over YouTube's
TV streaming API — enough "not a bot" signal to pass from GCP's datacenter IP,
with no account cookies or proxy required.

```bash
CUSTOM_INNERTUBE_CLIENT=TV_SIMPLY   # TV client, far less strict bot detection
YOUTUBE_GENERATE_PO_TOKENS=1        # generate poTokens via bgutils-js
YOUTUBE_USE_ONESIE=1                # use YouTube's TV streaming API
```

These are wired into `.github/workflows/deploy-api.yml` (the Cloud Run
`--set-env-vars` line), so every deploy keeps them. **Do not drop them** — a
deploy that omits them replaces all env vars and the bot challenge comes back.
To apply without a code deploy:

```bash
gcloud run services update grab-api --project=grab-media-dl --region=us-central1 \
  --update-env-vars="CUSTOM_INNERTUBE_CLIENT=TV_SIMPLY,YOUTUBE_GENERATE_PO_TOKENS=1,YOUTUBE_USE_ONESIE=1"
```

## Escalation ladder (only if YouTube tightens again)

The env-var fix above is sufficient today. YouTube's detection evolves, so if
challenges return, escalate in this order — each is a bigger hammer:

### 1. YouTube cookies (strongest, no recurring cost)

A logged-in session directly satisfies "sign in to confirm you're not a bot".
cobalt reads a JSON cookie file (`COOKIE_PATH`) with a `youtube` array of
cookie strings. Use a **burner Google account**, never your personal one, and
store the file as a secret — never in the image or repo.

1. Log into YouTube in a fresh browser profile with a burner account.
2. Export the `youtube.com` cookies (e.g. a cookies.txt extension), and shape
   them into cobalt's format: `{ "youtube": ["cookie1=value1", "cookie2=value2", ...] }`.
3. Store as a GCP secret and mount it into the container:
   ```bash
   gcloud secrets create grab-youtube-cookies --data-file=cookies.json --project=grab-media-dl
   gcloud run services update grab-api --project=grab-media-dl --region=us-central1 \
     --update-secrets=/cookies/cookies.json=grab-youtube-cookies:latest \
     --update-env-vars=COOKIE_PATH=/cookies/cookies.json
   ```
   (To make it permanent, add the same `--set-secrets` / `COOKIE_PATH` to the
   deploy workflow.)

### 2. Residential / Cloudflare WARP proxy

Route egress through a non-datacenter IP via `HTTP_PROXY`/`HTTPS_PROXY`. Note
Cloud Run can't run a gluetun sidecar (no `/dev/net/tun`), so this means either
an external residential proxy service (ongoing cost) or moving the API to a
Compute Engine VM. The VM + Cloudflare WARP compose setup is below.

## Services that require cookies / auth

Most services work with no credentials. These are the exceptions — all are
configured through the same `COOKIE_PATH` JSON file described in the YouTube
cookie section above (one file, one key per service):

```json
{
  "reddit": ["client_id=...; client_secret=...; refresh_token=..."],
  "instagram": ["sessionid=...; ds_user_id=..."],
  "youtube": ["...only if the env-var fix stops being enough..."]
}
```

- **reddit — required for all reddit content.** Reddit now returns HTTP 403
  ("log in to continue") on its unauthenticated `.json` endpoints from every
  IP, so every reddit link fails with `error.api.fetch.fail` until an OAuth app
  credential is configured. The extractor already switches to `oauth.reddit.com`
  once the cookie exists — no code change needed. To set it up: create a Reddit
  app (https://www.reddit.com/prefs/apps, type "script"), authenticate an account
  against Reddit's OAuth2 API to get a `refresh_token`
  (see https://github.com/reddit-archive/reddit/wiki/OAuth2), and put
  `client_id`, `client_secret`, `refresh_token` in the `reddit` cookie entry.
- **instagram — only for stories, private, or age-gated posts.** Public reels
  and posts work with no cookies. Supply an `instagram` session cookie only if
  you need the gated content.

Mount the cookie file the same way as the YouTube secret
(`--update-secrets=/cookies/cookies.json=... --update-env-vars=COOKIE_PATH=...`).

## Compute Engine + Cloudflare WARP via Gluetun (VM only)

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
