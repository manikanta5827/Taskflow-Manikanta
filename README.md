# TaskFlow Backend

A production-ready task management system built with Bun, Hono, and PostgreSQL.
Designed for Zomato Greening India as a take-home assignment.

## 1. Overview

TaskFlow is a robust task and project management backend API. It leverages modern, high-performance web tooling (Bun/Hono), strict TypeScript, and the Prisma ORM.

## 2. Features Implemented

- **Full REST API** for Users, Projects, and Tasks
- **Role-Based Access Control (RBAC)**: Enforces OWNER/MEMBER permissions.
- **In-Memory Rate Limiting**: Dedicated auth, task, and general boundaries.
- **Soft Deletion**: Implemented seamlessly via `deletedAt` timestamps.
- **Audit Logging**: Captures state changes, task reassignments, and deletion logs.
- **Idempotency Keys**: Safely handles retries on POST/PATCH endpoints.
- **Mocked Notifications**: Simulates emails correctly placed in audit flows.
- **Search & Filtering**: Comprehensive task querying.
- **Connection Pooling**: PostgreSQL URL configured properly.
- **Security Check**: Properly hashes passwords via bcryptjs.

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

- **Hono over Express**: Hono is fundamentally designed for edge compute and web standards (`Request`/`Response`), making it blindingly fast on Bun and extremely lightweight.
- **Folder Structure**: Segmenting logic into Repositories -> Services -> Controllers ensures testable boundaries and DRY code.
- **Soft Deletes**: Important for accountability and data recovery in an enterprise app like a reforestation initiative.
- **In-Memory Rate Limiting**: Redis is preferable in cluster environments, but for simplicity and reducing external dependencies in this tier, an in-memory sliding window provides immediate protection without infrastructure overhead.

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
- `POST /projects/:id/restore`

_Task Endpoints_ (Require Bearer Token)

- `GET /projects/:id/tasks?status=TODO&assignee=UUID&search=hello`
- `POST /projects/:id/tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `POST /tasks/:id/restore`

_System Endpoints_

- `GET /health` -> 200/503
- `GET /audit-logs?entityType=task`

## 6. Running Locally

If you want to run via source directly:

```bash
bun install
docker-compose up db -d # Ensure DB is running
bunx prisma migrate deploy
bunx prisma db seed
bun run dev
```

To view logs: `tail -f logs/app.log`

## 7. Database Schema

Models are interconnected via strict UUID foreign keys.

- **Soft Deletes**: Used across `projects` and `tasks` to avoid dangling references while keeping statistical accuracy.
- **Indexing**: Extensive indexing on composite keys (e.g. `projectId + status`) handles query distribution cleanly.

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
