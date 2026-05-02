<div align="center">

# TaskFlow Backend

A simple and reliable way to manage projects and track team tasks.

</div>

## 1. What is TaskFlow?

TaskFlow helps teams stay organized. It's a backend system where you can create projects, add tasks, and assign them to people. We've built in some smart features to make sure everything stays secure and easy to track.

### What you can do:

- **Sign up and Log in**: Secure accounts with different roles. Some people can own projects, while others just help out.
- **Organize Projects**: Create a space for your project and see how it's doing with quick stats.
- **Track Tasks**: Break work down into tasks. You can set priorities, due dates, and see exactly who's working on what.
- **Reliable History**: Every time a task's status changes or someone else takes it over, we keep a log so you don't lose track.
- **Safe Retries**: If a request fails and you try again, we make sure it doesn't create duplicate data.

## 2. Quick Start

### What you need:

- Docker and Docker Compose
- Bun (if you want to run it without Docker)

### How to run it:

```bash
git clone <repo>
cd taskflow-backend
cp .env.example .env

# Start everything at once
docker-compose up -d --build
```

**Access the API**: `http://localhost:8080`

**Login for testing:**

- **Email**: `test@example.com`
- **Password**: `password123`

## 3. How it's built

- **Fast & Modern**: We used **Bun** and **Hono** to keep things quick.
- **Safe Data**: **Prisma** helps us keep the database organized and error-free.
- **Smart Security**: Passwords are hashed safely, and we use JWT tokens to keep you logged in.
- **Abuse Protection**: We've included rate limiting so the system doesn't get overloaded.

## 4. API Details

If you're a developer and want to see all the endpoints and how to use them, check out the [API Documentation](api.md).

## 5. Running it manually

If you don't want to use Docker, you can run it directly:

```bash
# Install what's needed
bun install

# Setup the database
bun run prisma:migrate
bun run prisma:generate
bun run prisma:seed

# Start the server
bun run dev
```

You can check the logs at `logs/app.log`.

## 6. Ideas for the future

- **Real Database for Cache**: Use Redis to handle high traffic even better.
- **Better Search**: Add tools like Elasticsearch to help find tasks faster.
- **Email Notifications**: Switch from fake emails to real ones using a service like SES.
- **Task Connections**: Let tasks depend on each other (e.g., "don't start this until that is done").



## 7. Testing

We've written a lot of tests to make sure everything works properly.

- **Run tests**: `bun run test`
- **Just integration tests**: `bun run test:integration`
