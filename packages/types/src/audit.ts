export enum AuditActorType {
  ANONYMOUS = 'ANONYMOUS',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  INTERNAL = 'INTERNAL',
}

export enum AuditOutcome {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  DENIED = 'DENIED',
}

export interface RecordAuditEventInput {
  action: string;
  actorType: AuditActorType;
  actorUserId?: string;
  targetType?: string;
  targetId?: string;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
  requestId?: string;
}
