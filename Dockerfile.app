# ---------- Builder (Node + pnpm) ----------
FROM node:20-slim AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests and patches first (for Docker layer caching)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install

# Copy the rest of the source (node_modules is excluded by .dockerignore)
COPY . .

# Patch vite.config.ts to use postcss CSS transformer (avoids lightningcss @theme error)
RUN sed -i "s/export default defineConfig({/export default defineConfig({\\n  css: { transformer: 'postcss' },/" vite.config.ts || true

# Build using pnpm exec
RUN pnpm exec vite build && \
    pnpm exec esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && \
    cp dist/public/index.html dist/index.html

# ---------- Runtime (nginx) ----------
FROM nginx:alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
