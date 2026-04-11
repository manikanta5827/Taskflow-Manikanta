# TaskFlow API Documentation

All API requests and responses are in JSON format. For protected endpoints, include the header `Authorization: Bearer <your_jwt_token>`.

## 1. Authentication

### POST `/auth/register`
Register a new user in the system.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "MEMBER" // Optional: ADMIN, OWNER, MEMBER (default: MEMBER)
}
```

**Response (201 Created):**
```json
{
  "token": "jwt_access_token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "MEMBER",
    "createdAt": "timestamp"
  }
}
```

### POST `/auth/login`
Authenticate and receive a JWT.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "token": "jwt_access_token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "MEMBER"
  }
}
```

---

## 2. Projects

### GET `/projects`
List all projects you own or are collaborating on (assigned tasks in). Supports pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Project Name",
    "description": "Project Description",
    "ownerId": "uuid",
    "createdAt": "timestamp"
  }
]
```

### POST `/projects`
Create a new project. You will automatically be assigned as the `OWNER`.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Optional description"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "New Project",
  "description": "Optional description",
  "ownerId": "uuid",
  "createdAt": "timestamp"
}
```

### GET `/projects/:id`
Get detailed information about a project, including its tasks.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "...",
  "ownerId": "uuid",
  "tasks": [
    { "id": "uuid", "title": "...", "status": "TODO", ... }
  ]
}
```

### PATCH `/projects/:id` (Owner Only)
Update project details.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated Description"
}
```

**Response (200 OK):** Returns the updated project object.

### DELETE `/projects/:id` (Owner Only)
Permanently delete a project and all its associated tasks.

**Response:** `204 No Content`

### GET `/projects/:id/stats` (Owner Only)
Get task completion statistics and assignee distribution for a project.

**Response (200 OK):**
```json
{
  "byStatus": {
    "TODO": 5,
    "IN_PROGRESS": 2,
    "DONE": 10
  },
  "byAssignee": {
    "John Doe": 3,
    "Jane Smith": 2,
    "unassigned": 12
  }
}
```

---

## 3. Tasks

### GET `/projects/:id/tasks`
List all tasks for a specific project.

**Query Parameters:**
- `status`: `TODO`, `IN_PROGRESS`, or `DONE` (optional)
- `assignee`: User UUID (optional)
- `search`: Search in title (optional)
- `page`, `limit`: Pagination (optional)

**Response (200 OK):** Array of task objects.

### POST `/projects/:id/tasks` (Project Owner Only)
Create a new task within a project.

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Optional",
  "status": "TODO",     // TODO, IN_PROGRESS, DONE (default: TODO)
  "priority": "MEDIUM", // LOW, MEDIUM, HIGH (default: MEDIUM)
  "assigneeId": "uuid", // Optional
  "dueDate": "ISOString" // Optional
}
```

**Response (201 Created):** Returns the created task object.

### PATCH `/tasks/:id` (Access Checked)
Update task details (Status, Assignee, Priority, etc.).

**Request Body:** All fields are optional.
```json
{
  "title": "...",
  "status": "DONE",
  "assigneeId": "uuid",
  ...
}
```

**Response (200 OK):** Returns the updated task object.

### DELETE `/tasks/:id` (Access Checked)
Permanently delete a single task.

**Response:** `204 No Content`

### GET `/tasks/:id/logs` (Access Checked)
Get the audit history for a specific task (status changes, reassignments).

**Response (200 OK):** Array of audit log objects.

---

## 4. System

### GET `/health`
Check if the API and Database are healthy.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### GET `/audit-logs` (Admin Only)
List general system audit logs.

**Query Parameters:**
- `entityType`, `entityId`, `userId` (optional filters)

**Response (200 OK):** Array of audit log entries.
