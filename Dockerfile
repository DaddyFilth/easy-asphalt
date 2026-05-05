# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package manifests and patches
COPY package.json pnpm-lock.yaml* .npmrc ./
COPY patches/ ./patches/

# Install ALL dependencies (need devDeps for build)
RUN pnpm install --frozen-lockfile

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Build: vite (client → dist/public) + esbuild (server → dist/index.js)
RUN pnpm build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package manifests for prod-only install
COPY package.json pnpm-lock.yaml* .npmrc ./
COPY patches/ ./patches/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artefacts from builder
COPY --from=builder /app/dist ./dist

# The compiled server (dist/index.js) resolves static assets from dist/public
# at runtime via __dirname, so no extra copies needed.

EXPOSE 3000

CMD ["node", "dist/index.js"]
