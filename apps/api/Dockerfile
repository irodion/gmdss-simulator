FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages
COPY packages/db/package.json packages/db/
COPY packages/utils/package.json packages/utils/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY packages/db/ packages/db/
COPY packages/utils/ packages/utils/
COPY apps/api/ apps/api/
COPY apps/frontend/public/content/ apps/frontend/public/content/
COPY tsconfig.base.json ./

EXPOSE 3001

USER node
CMD ["node", "apps/api/src/index.ts"]
