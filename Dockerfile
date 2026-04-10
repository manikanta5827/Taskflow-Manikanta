FROM oven/bun:1.1.3 AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Generate Prisma client
COPY prisma ./prisma
RUN bun run prisma generate

# Copy source and build single-file executable
COPY . .
RUN bun build ./src/index.ts --target=bun --outfile=dist/index.js

# Production Stage
FROM oven/bun:1.1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install ONLY production dependencies (needed for Prisma CLI migrations)
COPY package.json bun.lockb* ./
RUN bun install --production

# Copy the generated bundle and prisma files
COPY --from=builder /app/dist/index.js ./dist/index.js
COPY --from=builder /app/prisma ./prisma

# Create logs directory
RUN mkdir logs

EXPOSE 8080

# The startup command runs db migrations, idempotent seed, and starts the bundled app
CMD ["sh", "-c", "bun run prisma migrate deploy && bun run prisma db seed && bun run dist/index.js"]
