FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies with BuildKit cache
COPY package.json bun.lockb* ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Generate Prisma client
COPY prisma ./prisma
RUN bun run prisma generate

# Copy source and build single-file executable
COPY . .
RUN bun build ./src/index.ts --target=bun --outfile=dist/index.js

# Production Stage
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy necessary files from builder
COPY package.json bun.lockb* ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --production

# Copy the generated bundle and prisma files
COPY --from=builder /app/dist/index.js ./dist/index.js
COPY --from=builder /app/prisma ./prisma

# Create logs directory
RUN mkdir logs

EXPOSE 8080

# The startup command runs db migrations, idempotent seed, and starts the bundled app
CMD ["sh", "-c", "bun run prisma migrate deploy && bun run prisma db seed && bun run dist/index.js"]
