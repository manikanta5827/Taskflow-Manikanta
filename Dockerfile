FROM oven/bun:1.1.3 as builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

# Generate Prisma client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
# Type checking
# RUN bunx tsc --noEmit (optional, skipping for faster build if relying on local)

FROM oven/bun:1.1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Create logs directory
RUN mkdir logs

EXPOSE 4000

# The startup command runs db migrations and starts the app
CMD ["sh", "-c", "bunx prisma migrate deploy && bunx prisma db seed && bun run src/index.ts"]
