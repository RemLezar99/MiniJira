# MiniJira
A small Jira-style applilcation made for learning purposes

## Tech Stack

- React + TypeScript
- Express + TypeScript
- PostgreSQL
- Prisma
- Zod
- Docker Compose

## Project Structure

```text
mini-jira/
  client/
  server/
  docker-compose.yml
  README.md
```

## Prerequisites

Prerequisites

Install the following before starting:

- Node.js
- npm
- Docker
- Docker Compose

You can verify your installation with:
```text
node --version
npm --version
docker --version
docker compose version
```

## Local Development Setup
### 1. Clone the repository
```
git clone <repository-url>
cd mini-jira
```

### 2. Start PostgreSQL
From the project root:
```
docker compose up -d
```

### 3. Install server dependencies
```
cd server
npm install
```

### 4. Configure server environment variables
Create a .env file inside server/:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_jira"
PORT=4000
JWT_SECRET="replace-this-with-a-development-secret"
```

### 5. Run Prisma migrations
From server/:
```
npx prisma migrate dev
```
Optional: Open Prisma Studio to inspect the database:
```
npx prisma studio
```

### 6. Start the backend server
From server/:
```
npm run dev
```
The API should run on:
```
http://localhost:4000
```

A health check endpoint should be available at:
```
GET http://localhost:4000/health
```

### 7. Install client dependencies
Open a second terminal:
```
cd client
npm install
```

### 8. Configure client environment variables
Create a .env file inside client/:
```
VITE_API_URL="http://localhost:4000"
```
This assumes the frontend is built with Vite.

### 9. Start the frontend
from client/:
```
npm run dev
```
The react app should run on:
```
http://localhsot:5173
```

## Useful Development Commands
### Server
```
cd server
npm run dev
npx prisma migrate dev
npx prisma studio
```
### Client
```
cd client
npm run dev
```

### Database
Start database:
```
docker compose up -d
```
Stop database:
```
docker compose down
```
Stop database and remove volumes:
```
docker compose down -v
```

## Initial API Endpoints
The first version of the backend should include:
```
GET  /health

POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me

GET    /projects
POST   /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId

GET    /projects/:projectId/issues
POST   /projects/:projectId/issues
GET    /projects/:projectId/issues/:issueId
PATCH  /projects/:projectId/issues/:issueId
DELETE /projects/:projectId/issues/:issueId
```

## Development Notes

One note: the README assumes a Vite-based React client and a backend running on port `4000`. We can adjust those once we decide the exact project initialization commands.