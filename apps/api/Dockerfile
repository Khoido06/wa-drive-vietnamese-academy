FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Install deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ ./apps/api/
COPY docs/driver-guide-vi.pdf ./docs/driver-guide-vi.pdf
COPY docs/states/ ./docs/states/

ENV WA_DRIVER_GUIDE_PDF_PATH=./docs/driver-guide-vi.pdf
ENV CA_DRIVER_GUIDE_PATH=./docs/states/ca-driver-guide-vi.md
ENV TX_DRIVER_GUIDE_PATH=./docs/states/tx-driver-guide-vi.md
ENV FL_DRIVER_GUIDE_PATH=./docs/states/fl-driver-guide-vi.md
ENV NODE_ENV=production
ENV PROJECT_ROOT=/app

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["pnpm", "start"]
