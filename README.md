# TaskFlow Backend

A production-ready task management system built with Bun, Hono, and PostgreSQL.
Designed for Zomato Greening India as a take-home assignment.

## 1. Overview

TaskFlow is a robust task and project management backend API. It leverages modern, high-performance web tooling (Bun/Hono), strict TypeScript, and the Prisma ORM.

## 2. Features Implemented

- **Full REST API** for Users, Projects, and Tasks
- **Role-Based Access Control (RBAC)**: Enforces OWNER/MEMBER/ADMIN permissions.
- **In-Memory Rate Limiting**: Dedicated auth, task, and general sliding-window protection.
- **Permanent Deletion**: Strictly enforces data integrity via hard deletes (removed soft-delete).
- **Audit Logging**: Captures state changes, task reassignments, and deletion events with IP tracking.
- **Idempotency Keys**: Safely handles retries on POST/PATCH endpoints via global middleware.
- **Zod Validation**: Strict schema-based input validation for all routes and parameters.
- **Hono JWT**: Standardized authentication using Hono's native JWT helper.
- **Prisma 7**: Modernized ORM configuration with `prisma.config.ts`.
- **Mocked Notifications**: Simulates emails correctly placed in audit flows.

## 3. Quick Start

### Prerequisites

- Docker & Docker Compose
- Bun (latest) (optional if purely using Docker)

### Setup

```bash
git clone <repo>
cd taskflow-backend
cp .env.example .env

# Fire up the completely pre-configured multi-container setup
docker-compose up -d --build
```

**API Base URL**: `http://localhost:8080`

**Test Credentials:** (From Prisma Seed)

- **Email**: test@example.com
- **Password**: password123

## 4. Architecture Decisions

- **Hono over Express**: Hono is fundamentally designed for edge compute and web standards (`Request`/`Response`), making it blindingly fast on Bun.
- **Folder Structure**: Segmenting logic into Repositories -> Services -> Controllers ensures testable boundaries and DRY code.
- **Hard Deletes**: Requirement check confirmed that permanent deletion is preferred for this specific deployment stage to simplify data lifecycles.
- **In-Memory Rate Limiting**: Provides immediate protection without external infrastructure overhead like Redis for this tier.

## 5. API Documentation

_Auth Endpoints_

- `POST /auth/register` (body: name, email, password)
- `POST /auth/login` (body: email, password)

_Project Endpoints_ (Require Bearer Token)

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id` (idempotency support)
- `DELETE /projects/:id`

_Task Endpoints_ (Require Bearer Token)

- `GET /projects/:id/tasks?status=TODO&assignee=UUID&search=hello`
- `POST /projects/:id/tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `GET /tasks/:id/logs` (Audit logs for specific task)

_System Endpoints_

- `GET /health` -> 200/503
- `GET /audit-logs?entityType=task`

## 6. Running Locally

If you want to run via source directly:

```bash
bun install
docker compose up db -d # Ensure DB is running
bun run prisma:migrate:deploy
bun run prisma:seed
bun run dev
```

To view logs: `tail -f logs/app.log`

## 7. Database Schema

Models are interconnected via strict UUID foreign keys.

- **Permanent Deletion**: Data is wiped upon deletion confirmation. No `deletedAt` flags are used.
- **Indexing**: Extensive indexing on composite keys (e.g. `projectId + status`) and foreign keys handles query distribution cleanly.

## 8. What I'd Do With More Time

- **Distributed Caching/Redis**: Switch idempotency and rate limiting to Redis so it correctly blocks repeated calls across horizontally scaled pods.
- **Pagination**: The `GET` endpoints can easily be overloaded. Adding cursor-based Prisma pagination would resolve this immediately.
- **Websockets/SSE**: Replace mocked emails with pushed realtime state changes for the UI.
- **Task Dependencies**: "Task A must finish before Task B" modeling in Prisma.

## 9. Testing

Testing relies on Jest and Supertest.

- Run tests: `bun run test`
- Current theoretical coverage hits critical controller logic and database validations.

## 10. Security Measures

- **Hashing**: Strong bcrypt integration (cost 12 default).
- **JWT**: Token expiries enforced tightly with isolated secrets.
- **SQLi**: Escaped natively by Prisma queries.
- **Overfetching**: Thin controllers returning specific objects instead of broad datasets.
