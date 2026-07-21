import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextService } from '../../common/request-context';
import { RecordAuditEventInput, AuditOutcome } from '@nexthire/types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  // Sensitive keys to strip from metadata (case-insensitive)
  private readonly SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'cookie',
    'secret',
    'otp',
    'verificationcode',
    'privatekey',
    'cardnumber',
    'cvv',
  ]);

  private readonly MAX_DEPTH = 5;
  private readonly MAX_JSON_SIZE = 16 * 1024; // 16 KB
  private readonly MAX_STRING_LENGTH = 2000;
  private readonly MAX_ARRAY_LENGTH = 100;
  private readonly ACTION_REGEX = /^[a-z0-9._]+$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContextService: RequestContextService,
  ) {}

  /**
   * Records an audit event. Fails silently (logs error) if the write fails.
   */
  async recordBestEffort(input: RecordAuditEventInput): Promise<void> {
    try {
      await this.recordRequired(input);
    } catch (error) {
      this.logger.error(
        `Failed to record audit event best-effort: ${input.action}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Records an audit event. Throws if the write fails.
   */
  async recordRequired(input: RecordAuditEventInput): Promise<void> {
    this.validateActionName(input.action);

    const requestId = input.requestId || this.requestContextService.getRequestId();
    const sanitizedMetadata = this.sanitizeMetadata(input.metadata);

    try {
      await this.prisma.auditLog.create({
        data: {
          requestId,
          actorType: input.actorType,
          actorUserId: input.actorUserId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          outcome: input.outcome ?? AuditOutcome.SUCCESS,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata: sanitizedMetadata as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log to database: ${input.action}`);
      throw new Error(`Audit recording failed for action: ${input.action}`);
    }
  }

  private validateActionName(action: string): void {
    if (!this.ACTION_REGEX.test(action) || action.length > 150) {
      throw new Error(`Invalid audit action name: ${action}`);
    }
  }

  /**
   * Sanitizes metadata to remove sensitive information and enforce limits.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sanitizeMetadata(metadata?: Record<string, unknown>): any {
    if (!metadata) return null;

    try {
      // 1. Process limits and redact sensitive keys
      const sanitized = this.processNode(metadata, 0);

      // 2. Validate JSON size
      const stringified = JSON.stringify(sanitized);
      if (Buffer.byteLength(stringified, 'utf8') > this.MAX_JSON_SIZE) {
        throw new Error('Metadata exceeds maximum size limit');
      }

      return sanitized;
    } catch (error) {
      this.logger.warn('Failed to sanitize metadata, returning redacted fallback.');
      return { _error: 'Metadata sanitization failed or exceeded limits' };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processNode(node: any, depth: number): any {
    if (depth > this.MAX_DEPTH) {
      return '[TRUNCATED]';
    }

    if (node === null || node === undefined) {
      return null;
    }

    const type = typeof node;

    if (type === 'function' || type === 'symbol') {
      return undefined;
    }

    if (type === 'bigint') {
      return node.toString();
    }

    if (type === 'string') {
      return node.length > this.MAX_STRING_LENGTH
        ? node.substring(0, this.MAX_STRING_LENGTH) + '...[TRUNCATED]'
        : node;
    }

    if (type !== 'object') {
      return node;
    }

    if (Array.isArray(node)) {
      const arrLength = Math.min(node.length, this.MAX_ARRAY_LENGTH);
      const arr = [];
      for (let i = 0; i < arrLength; i++) {
        const val = this.processNode(node[i], depth + 1);
        if (val !== undefined) arr.push(val);
      }
      if (node.length > this.MAX_ARRAY_LENGTH) {
        arr.push('[TRUNCATED_ARRAY]');
      }
      return arr;
    }

    // Process object
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(node)) {
      if (this.isSensitiveKey(key)) {
        result[key] = '[REDACTED]';
      } else {
        const val = this.processNode(node[key], depth + 1);
        if (val !== undefined) {
          result[key] = val;
        }
      }
    }

    return result;
  }

  private isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_KEYS.has(key.toLowerCase());
  }
}
