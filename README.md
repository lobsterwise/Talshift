# Talshift

Talshift is a blank React single-page app served by a Rocket HTTP server. Rocket also exposes the API and connects to PostgreSQL through SQLx.

## Requirements

- Node.js 20.19 or newer (Node.js 22 LTS recommended) and npm
- Rust stable and Cargo
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

Use credentials appropriate for your local database; do not commit them.

## Development

Start Rocket from the repository root in one terminal:

```sh
cargo run --manifest-path backend/Cargo.toml
```

Start Vite in another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. Requests to `/api/*` are proxied to Rocket at `http://127.0.0.1:8000`.

## Production Build

Build the frontend before starting Rocket:

```sh
cd frontend
npm ci
npm run build
cd ..
cargo run --manifest-path backend/Cargo.toml
```

Rocket serves `frontend/dist` by default. Set `FRONTEND_DIST` to use another build directory.

## Checks

```sh
cd frontend
npm run typecheck
npm run build
cd ..
cargo fmt --manifest-path backend/Cargo.toml --check
cargo check --manifest-path backend/Cargo.toml
cargo test --manifest-path backend/Cargo.toml
```

`GET /api/health` runs `SELECT 1` and returns `{"status":"ok"}` when the database is available. Unknown API routes return a JSON 404. No database schema or migrations are required for this starter.
