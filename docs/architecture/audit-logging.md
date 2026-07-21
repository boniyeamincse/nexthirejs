# Audit Logging Architecture

## Overview

NextHire utilizes a centralized, immutable audit log to record security-relevant and business-critical operations. The `AuditModule` provides the infrastructure for securely persisting these events to the database.

## Design Principles

1. **Immutability**: Audit records are insert-only. The application explicitly does not expose update or delete operations for audit logs.
2. **Context-Aware**: The `AuditService` automatically extracts the `requestId` from the `RequestContextService` if one is not explicitly provided.
3. **Structured Naming**: Audit actions follow a strict domain.resource.action pattern (e.g., `auth.candidate.registered`).
4. **Data Sanitization**: Sensitive keys (like passwords, tokens, and secrets) are automatically redacted from metadata payloads before persistence.

## Using the Audit Service

The `AuditService` exposes two primary methods depending on the required failure strategy:

- **`recordRequired(input)`**: Throws an application error if the audit write fails. Use this for operations where an audit trail is strictly required (e.g., payments, permission changes).
- **`recordBestEffort(input)`**: Fails silently (logs to the application logger) if the audit write fails. Use this for lower-risk operations where business continuity is prioritized over audit completeness.

## Data Model

The `AuditLog` table stores:

- `occurredAt`: UTC timestamp of the event.
- `requestId`: The correlation ID.
- `actorType`: `ANONYMOUS`, `USER`, `SYSTEM`, or `INTERNAL`.
- `actorUserId`: The ID of the actor (if applicable).
- `action`: The validated action string.
- `targetType` & `targetId`: References to the affected resource.
- `outcome`: `SUCCESS`, `FAILURE`, or `DENIED`.
- `metadata`: JSON-safe, sanitized, and bounded context data.

## Sanitization Limits

To protect the database and ensure performance, metadata undergoes strict sanitization:

- **Sensitive Keys**: Keys matching `password`, `token`, `secret`, etc. are replaced with `[REDACTED]`.
- **Depth Limit**: Maximum object depth of 5.
- **Array Limit**: Maximum 100 items per array.
- **String Limit**: Strings exceeding 2000 characters are truncated.
- **Total Payload Size**: Maximum 16 KB JSON size. Functions and symbols are stripped out.
