# NextHire Local Docker Infrastructure

## Purpose

This Docker setup runs only the local supporting infrastructure needed for NextHire development. Application source code is expected to run directly on the developer machine for fast feedback while Docker provides PostgreSQL, Redis, MinIO, and Mailpit.

## Prerequisites

- Docker
- Docker Compose
- pnpm
- A local `.env` file based on the committed `.env.example`

## Setup

Copy the example environment file only if a local `.env` does not already exist:

```bash
test -f .env || cp .env.example .env
```

Validate the Compose configuration:

```bash
pnpm infra:config
```

## Starting Services

Pull the images and start the infrastructure:

```bash
docker compose --env-file .env -f infrastructure/docker/compose.dev.yml pull
pnpm infra:up
```

## Checking Service Status

```bash
pnpm infra:ps
```

## Viewing Logs

```bash
pnpm infra:logs
```

## Stopping Services

```bash
pnpm infra:down
```

This stops containers without deleting named volumes.

## Service Endpoints

- PostgreSQL: `localhost:${POSTGRES_PORT}`
- Redis: `localhost:${REDIS_PORT}`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Mailpit SMTP: `localhost:1025`
- Mailpit Web: `http://localhost:8025`

## Data Persistence

This setup uses Docker named volumes so local PostgreSQL, Redis, and MinIO data survive container restarts and normal `pnpm infra:down` operations.

## Manual Data Reset

Warning: this permanently deletes local PostgreSQL, Redis, and MinIO data.

```bash
docker compose --env-file .env -f infrastructure/docker/compose.dev.yml down -v
```

Run that command only when you intentionally want to reset local infrastructure state.

## Troubleshooting

- Run `pnpm infra:config` first if Compose fails to parse the file or environment values.
- Check `pnpm infra:ps` to confirm container and health status.
- Use `pnpm infra:logs` to inspect startup failures.
- Ensure ports `5432`, `6379`, `9000`, `9001`, `1025`, and `8025` are not already in use locally.
- If the Docker daemon is not running, start Docker Desktop or the local Docker service and retry.
- If MinIO bucket initialization fails, inspect the `minio-init` container logs and rerun `pnpm infra:up`.

## Security Warning

These settings are for local development only. The credentials are placeholders, the services are bound to localhost, and the image tags and security posture must be reviewed and pinned separately for any production planning.
