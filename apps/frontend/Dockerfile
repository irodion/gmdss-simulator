FROM node:24-alpine AS build

WORKDIR /app

# Install pnpm and vp
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN npm install -g @voidzero-dev/vite-plus

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages
COPY packages/utils/package.json packages/utils/
COPY apps/frontend/package.json apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY packages/utils/ packages/utils/
COPY apps/frontend/ apps/frontend/
COPY tsconfig.base.json ./

# Vite inlines VITE_* env vars at build time.
# Default to empty string so the frontend uses relative URLs (same-origin via Caddy).
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
WORKDIR /app/apps/frontend
RUN vp build

# Serve static files with Caddy
FROM caddy:2-alpine
COPY --from=build /app/apps/frontend/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
