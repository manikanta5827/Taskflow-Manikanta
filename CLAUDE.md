# Taskflow Backend Context

This file serves as central context to act as a system prompt/guideline for AI assistance (Claude/Cursor).

## Tech Stack Overview
- **Runtime**: Bun
- **Language**: TypeScript (Strict Mode)
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Jest (`bun run test`)
- **Formatting & Linting**: Prettier + ESLint + Husky (`bun run lint`, `bun run format`)
- **Security Check**: Husky relies on Conventional Commits (`feat: `, `fix: `).

## Layered Architecture
This project STRICTLY isolates concerns:
1. **`controllers/`**: Extracts parameters and handles HTTP responses. **NO logic or raw queries here**.
2. **`services/`**: Holds core business logic.
3. **`repositories/`**: Fully isolated database interaction layer making all Prisma ORM calls.
4. **`middleware/`**: Connects RBAC, Rate Limiting, Idempotency, and JWT Auth. 

## Architectural Rules
1. **Soft Deletions Only**: When a user or system deletes an entity, never wipe it from the DB. ALWAYS execute an update setting `deletedAt = new Date()`. Corresponding functions must ignore records where `deletedAt != null`. 
2. **Security Context**: Tokenization relies on `Bearer` JWT tokens mapping to `userId`. Password hashing explicitly uses native `Bun.password` relying on `bcrypt` cost 12 algorithms. Never install external hashers.
3. **Idempotency**: POST and PATCH endpoints strictly map idempotent caching using the `Idempotency-Key` header verified against internal cache stores.

## Key Terminals Commands
- Start Server: `bun dev` 
- Prisma Migrations: `bunx prisma migrate dev`
- Seed test subjects: `bunx prisma db seed`
