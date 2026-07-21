# Redis and BullMQ Integration

## 1. Purpose

Provides Redis connectivity and BullMQ job queue infrastructure for the NextHire API. All application queues use this foundation.

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   NestJS Application                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Redis    │  │ Queue    │  │ System            │  │
│  │ Module   │  │ Module   │  │ Module            │  │
│  │          │  │          │  │                   │  │
│  │ Service  │  │ Service  │  │ Controller        │  │
│  │ ping()   │  │ enqueue  │  │ POST /queue/ping  │  │
│  │ isReady()│  │ Ping()   │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│       │         ┌────▼────┐            │              │
│       │         │ Worker  │            │              │
│       │         │system-  │            │              │
│       │         │health   │            │              │
│       │         └─────────┘            │              │
└───────┼────────────────────────────────┼──────────────┘
        │                                │
        ▼                                ▼
   ┌─────────┐                    ┌──────────┐
   │  Redis  │                    │  BullMQ  │
   │ Server  │◄───────────────────│  Queue   │
   └─────────┘                    └──────────┘
```

## 3. Redis Variables

| Variable                        | Default     | Description             |
| ------------------------------- | ----------- | ----------------------- |
| `REDIS_HOST`                    | `localhost` | Redis server hostname   |
| `REDIS_PORT`                    | `6379`      | Redis server port       |
| `REDIS_USERNAME`                | (empty)     | Optional Redis username |
| `REDIS_PASSWORD`                | (empty)     | Optional Redis password |
| `REDIS_DB`                      | `0`         | Redis database number   |
| `REDIS_TLS`                     | `false`     | Enable TLS for Redis    |
| `REDIS_CONNECT_TIMEOUT_MS`      | `5000`      | Connection timeout      |
| `REDIS_COMMAND_TIMEOUT_MS`      | `5000`      | Command timeout         |
| `REDIS_MAX_RETRIES_PER_REQUEST` | `3`         | Max retry count         |

## 4. BullMQ Variables

| Variable                    | Default    | Description                    |
| --------------------------- | ---------- | ------------------------------ |
| `BULLMQ_PREFIX`             | `nexthire` | Queue key prefix in Redis      |
| `BULLMQ_DEFAULT_ATTEMPTS`   | `3`        | Default job retry attempts     |
| `BULLMQ_DEFAULT_BACKOFF_MS` | `1000`     | Exponential backoff base delay |
| `BULLMQ_REMOVE_ON_COMPLETE` | `100`      | Max completed jobs retained    |
| `BULLMQ_REMOVE_ON_FAIL`     | `500`      | Max failed jobs retained       |

## 5. Local Redis Startup

```bash
pnpm infra:up
```

Verify:

```bash
docker compose --env-file .env -f infrastructure/docker/compose.dev.yml exec -T redis redis-cli ping
# Expected: PONG
```

## 6. Queue and Job Constants

| Constant                 | Value           |
| ------------------------ | --------------- |
| `SYSTEM_HEALTH_QUEUE`    | `system-health` |
| `SYSTEM_HEALTH_PING_JOB` | `ping`          |

All queue names and job names are defined in `src/infrastructure/queue/queue.constants.ts`. No string literals are used elsewhere.

## 7. Producer Endpoint

```
POST /api/v1/system/queue/ping
Content-Type: application/json

{"source": "manual-test"}
```

Response `202 Accepted`:

```json
{
  "status": "queued",
  "queue": "system-health",
  "job": "ping",
  "jobId": "123"
}
```

**This endpoint is for development/infrastructure verification only.** Disable by setting `SYSTEM_QUEUE_TEST_ENABLED=false`.

## 8. Processor

The `SystemHealthProcessor` processes `ping` jobs on the `system-health` queue. It validates the payload defensively and returns:

```json
{
  "status": "processed",
  "source": "manual-test",
  "processedAt": "2024-01-01T00:00:00.000Z"
}
```

Invalid or malformed payloads cause the job to fail and be retried according to BullMQ configuration.

## 9. Readiness Check

The `GET /api/v1/health/ready` endpoint checks both:

- Database (PrismaService `SELECT 1`)
- Redis (ioredis `PING`)

Response when both are up:

```json
{
  "status": "ok",
  "service": "nexthire-api",
  "checks": {
    "database": "up",
    "redis": "up"
  }
}
```

If either check fails, HTTP 503 is returned with a safe message (no stack traces, no credentials).

## 10. Testing

```bash
# Unit tests
pnpm --filter @nexthire/api test

# E2E tests (requires Docker Redis)
pnpm infra:up
pnpm --filter @nexthire/api test:e2e
```

Unit tests mock Redis and BullMQ. E2E tests use the real Docker Redis but override PrismaService.

## 11. Shutdown Behavior

- `enableShutdownHooks()` is already enabled in `main.ts`
- `RedisService.onModuleDestroy()` calls `client.quit()` to close Redis gracefully
- `PrismaService.onModuleDestroy()` calls `$disconnect()` to close the database pool
- BullMQ workers are cleaned up by NestJS lifecycle hooks

## 12. Security Considerations

- Redis credentials are never logged
- Redis credentials are never returned in API responses
- No arbitrary queue names or job names accepted from external input
- Endpoint gated by `SYSTEM_QUEUE_TEST_ENABLED` environment variable
- DTO validation rejects invalid input
- Malformed job payloads cause clean job failure, not crashes

## 13. Production Limitations

- Single Redis instance (no Cluster/Sentinel)
- No TLS termination (configured, but disabled by default)
- No queue dashboard (Bull Board not installed)
- No scheduled/cron jobs
- No dead letter queue
- Worker is embedded in the API process (not a separate process)

## 14. Future Queue Domains

These queue domains are planned for future phases but are not implemented:

- notifications
- email
- payments
- payouts
- reports
- gamification

Each will extend the infrastructure created here.
