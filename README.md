# NestJS Backend

Simple Notes API built with NestJS. Includes health/version checks, note CRUD with API key auth, and an in-memory audit log.

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
- `PORT`: optional, defaults to `3000`

Example:

```bash
export API_KEY="local-dev-key"
export APP_VERSION="1.0.0"
```

## Run

```bash
pnpm start:dev
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
<!-- CI trigger -->
