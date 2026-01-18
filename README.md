# NestJS Backend

Simple Notes API built with NestJS. Includes health/version checks, note CRUD with API key auth, and PostgreSQL-backed notes + audit log.

## Requirements

- Node.js 20+
- pnpm

## Setup

```bash
pnpm install
```

## Configuration

Set environment variables before running:

- `API_KEY`: required for write endpoints (`POST/PATCH/DELETE /notes` and `POST /notes/:id/publish`)
- `APP_VERSION`: optional, shown by `/version`
- `DATABASE_URL`: required, PostgreSQL connection string
- `PORT`: optional, defaults to `3000`

Example:

```bash
export API_KEY="local-dev-key"
export APP_VERSION="1.0.0"
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/notes"
```

## Run

```bash
pnpm start:dev
```

## Database

The API expects two tables: `notes` and `audit_events`. You can seed them with the SQL below.

```sql
INSERT INTO notes (id, title, content, tags, published, created_at, updated_at)
VALUES (
  'c0a8012a-9f9c-4c3b-91a5-5d6a2d3c9c01',
  'Welcome note',
  'This is a seeded note for the Docker Compose demo.',
  ARRAY['demo','compose'],
  true,
  NOW(),
  NOW()
);

INSERT INTO audit_events (id, note_id, type, at, meta)
VALUES (
  'c0a8012a-9f9c-4c3b-91a5-5d6a2d3c9c02',
  'c0a8012a-9f9c-4c3b-91a5-5d6a2d3c9c01',
  'NOTE_PUBLISHED',
  NOW(),
  '{"source":"seed"}'
);
```

## Endpoints

- `GET /health` -> `{ status, uptimeSec, timestamp }`
- `GET /version` -> `{ appVersion, packageVersion }`
- `GET /notes` -> list notes (query: `limit`, `offset`, `q`, `tag`, `published`)
- `GET /notes/:id` -> note by id
- `POST /notes` -> create note (requires `x-api-key`)
- `PATCH /notes/:id` -> update note (requires `x-api-key`)
- `DELETE /notes/:id` -> delete note (requires `x-api-key`)
- `POST /notes/:id/publish` -> set published flag (requires `x-api-key`)
- `GET /audit` -> audit log (query: `noteId`)

## Testing

```bash
pnpm lint
pnpm test
```
