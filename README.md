# Talshift

Talshift is a React single-page app served by an Express HTTP server. The backend exposes authentication, profile, and workspace APIs and connects to PostgreSQL through `pg`.

## Requirements

- Node.js 20.19 or newer (Node.js 22 LTS recommended) and npm
- A reachable PostgreSQL database

## Configure PostgreSQL

Set `DATABASE_URL` in the shell where the backend will run. For PowerShell:

```powershell
$env:DATABASE_URL = "postgres://postgres:password@localhost:5432/talshift"
```

For Command Prompt:

```bat
set DATABASE_URL=postgres://postgres:password@localhost:5432/talshift
```

Set `GEMINI_API_KEY` in the backend environment to enable automatic student talent analysis. The backend keeps the key private and uses the `gemini-3.8-flash` model by default; set `GEMINI_MODEL` to another model enabled for your API key. Student profile saves return an error if Gemini is not configured or unavailable, rather than storing stale talent rankings.

Use credentials appropriate for your local database; do not commit them.

## Development

Start the backend from `backend/` in one terminal:

```powershell
cd backend
npm install
npm run dev
```

Then, in another terminal, start Vite:

```sh
cd frontend
npm install
npm run dev
```

Open the URL it prints; requests to `/api/*` are proxied to the backend at `http://127.0.0.1:3000`.

## Production Build

Build the frontend, then build and start the backend:

```sh
cd frontend
npm ci
npm run build
cd ../backend
npm ci
npm run build
npm start
```

The backend serves `frontend/dist` by default. Set `FRONTEND_DIST` to use another build directory, or `PORT` to change the HTTP port.

## Checks

```sh
cd frontend
npm run typecheck
npm run build
cd ../backend
npm run typecheck
npm run build
```

`GET /api/health` runs `SELECT 1` and returns `{"status":"ok"}` when the database is available, or HTTP 503 when it is not. Authentication and profile data are stored in PostgreSQL. Workspace collection endpoints currently return empty collections until those features are implemented. Unknown API routes return a JSON 404.
