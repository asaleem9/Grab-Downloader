FROM alpine:latest AS builder
WORKDIR /app

# Build args for configuration
ARG WEB_HOST="grab.run.app"
ARG WEB_DEFAULT_API="https://grab-api-z7onh2ju2q-uc.a.run.app/"

# Set env from build args
ENV WEB_HOST=${WEB_HOST}
ENV WEB_DEFAULT_API=${WEB_DEFAULT_API}

RUN apk add --no-cache nodejs npm git
RUN npm install -g pnpm

# Copy build stuff
COPY pnpm-workspace.yaml /app/
COPY web/ /app/web/
COPY packages/ /app/packages/
COPY .git /app/.git

# Build frontend
WORKDIR /app/web
RUN pnpm install
RUN pnpm run build

FROM caddy:alpine AS final
WORKDIR /srv
COPY --from=builder /app/web/build /srv
COPY web/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80