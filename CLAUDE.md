# Taskflow Backend Context

This file serves as central context to act as a system prompt/guideline for AI assistance (Claude/Cursor).

## Tech Stack Overview
- **Runtime**: Bun
- **Language**: TypeScript (Strict Mode)
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Validation**: Zod
- **Testing**: Jest (`bun run test`)
- **Formatting & Linting**: Prettier + ESLint + Husky (`bun run lint`, `bun run format`)
- **Security Check**: Husky relies on Conventional Commits (`feat: `, `fix: `).

## Layered Architecture
This project STRICTLY isolates concerns:
1. **`controllers/`**: Extracts parameters using **Zod** and handles HTTP responses. **NO logic or raw queries here**.
2. **`services/`**: Holds core business logic.
3. **`repositories/`**: Fully isolated database interaction layer making all Prisma ORM calls.
4. **`middleware/`**: Connects RBAC, Rate Limiting, Idempotency, and Hono JWT Auth. 

## Architectural Rules
1. **Permanent Deletions**: As per the latest requirements, use hard deletes (`prisma.delete`). DO NOT use `deletedAt` timestamps. Always ensure dependent data is handled via cascades where appropriate.
2. **Security Context**: Tokenization relies on Hono's native JWT helper. Password hashing explicitly uses native `Bun.password` relying on `bcrypt` cost 12 algorithms. Never install external hashers like `bcryptjs`.
3. **Idempotency**: POST and PATCH endpoints strictly map idempotent caching using the `Idempotency-Key` header verified against internal cache stores.
4. **Prisma Config**: Database connection for CLI (migrations/seeding) is managed via `prisma.config.ts`. The `schema.prisma` datasource block MUST NOT contain a hardcoded `url`.

## Key Terminal Commands
- Start Server: `bun run dev` 
- Prisma Migrations: `bun run prisma:migrate:deploy`
- Seed test subjects: `bun run prisma:seed`
- Typecheck: `bun run typecheck`
