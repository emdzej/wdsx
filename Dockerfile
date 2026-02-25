# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/viewer/package.json ./packages/viewer/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json tsconfig.json turbo.json ./
COPY packages/core ./packages/core
COPY packages/viewer ./packages/viewer

# Build the application
# Note: Data files are mounted at runtime, not during build
RUN pnpm --filter viewer build

# ============================================
# Stage 2: Production
# ============================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|svgz|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Data directory (mounted volume)
    location /data/ {
        alias /data/;
        expires 1d;
        add_header Cache-Control "public";
        
        # Enable directory listing for debugging (optional)
        # autoindex on;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Copy built assets from builder
COPY --from=builder /app/packages/viewer/build /usr/share/nginx/html

# Create data directory mount point
RUN mkdir -p /data

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
