FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Install deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ ./apps/api/
COPY docs/driver-guide-vi.pdf ./docs/driver-guide-vi.pdf

ENV NODE_ENV=production
ENV WA_DRIVER_GUIDE_PDF_PATH=./docs/driver-guide-vi.pdf
ENV PROJECT_ROOT=/app

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["pnpm", "start"]
