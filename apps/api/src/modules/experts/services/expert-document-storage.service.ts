/**
 * Private storage for expert verification documents.
 *
 * Documents are stored in a dedicated private bucket/prefix that is NEVER
 * served publicly. Objects are addressed by opaque, unguessable storage keys.
 * Reviewers receive short-lived signed URLs; applicants never get direct URLs.
 *
 * The implementation writes to the local filesystem in dev/test and is shaped
 * to be swapped for MinIO/S3 (same key + signed-URL contract) in production.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export const EXPERT_DOCS_BUCKET = 'nexthire-expert-docs';

export interface StoredObjectRef {
  storageKey: string;
  sizeBytes: number;
  checksumSha256: string;
}

@Injectable()
export class ExpertDocumentStorageService {
  private readonly logger = new Logger(ExpertDocumentStorageService.name);
  private readonly storageDir: string;
  private readonly signedUrlSecret: string;

  constructor(private readonly configService: ConfigService) {
    const basePath = this.configService.get<string>('STORAGE_LOCAL_PATH', './storage');
    this.storageDir = path.resolve(basePath, EXPERT_DOCS_BUCKET);
    this.signedUrlSecret = this.configService.get<string>(
      'EXPERT_DOCS_SIGNING_SECRET',
      this.configService.get<string>('APP_SECRET', 'insecure-dev-signing-secret'),
    );
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    this.logger.log(`Expert document storage initialized at ${this.storageDir}`);
  }

  /**
   * Generates an opaque, unguessable storage key namespaced by application.
   */
  generateKey(applicationId: string): string {
    const random = crypto.randomBytes(24).toString('hex');
    return `applications/${applicationId}/${random}`;
  }

  private resolveSafePath(storageKey: string): string {
    const resolved = path.resolve(this.storageDir, storageKey);
    const root = path.resolve(this.storageDir);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    return resolved;
  }

  /**
   * Persists a document buffer and returns integrity metadata.
   */
  async put(storageKey: string, buffer: Buffer): Promise<StoredObjectRef> {
    const resolved = this.resolveSafePath(storageKey);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, buffer, { mode: 0o600 });

    const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    this.logger.debug(`Stored expert document ${storageKey} (${buffer.length} bytes)`);
    return { storageKey, sizeBytes: buffer.length, checksumSha256 };
  }

  async read(storageKey: string): Promise<Buffer> {
    const resolved = this.resolveSafePath(storageKey);
    return fs.readFile(resolved);
  }

  async delete(storageKey: string): Promise<void> {
    const resolved = this.resolveSafePath(storageKey);
    try {
      await fs.unlink(resolved);
      this.logger.debug(`Deleted expert document ${storageKey}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  /**
   * Produces a short-lived, tamper-evident signed URL for a reviewer to fetch
   * a document. The signature binds the key + expiry so it cannot be replayed
   * past expiry or altered to point at a different object.
   */
  createSignedUrl(
    storageKey: string,
    expiresInSeconds: number,
  ): { url: string; expiresAt: string } {
    const expiresAtEpoch = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = this.sign(storageKey, expiresAtEpoch);
    const params = new URLSearchParams({
      key: storageKey,
      expires: String(expiresAtEpoch),
      signature,
    });
    const url = `/api/v1/manage/experts/documents?${params.toString()}`;
    return { url, expiresAt: new Date(expiresAtEpoch * 1000).toISOString() };
  }

  /**
   * Validates a previously issued signed URL token.
   */
  verifySignedUrl(storageKey: string, expiresEpoch: number, signature: string): boolean {
    if (!Number.isFinite(expiresEpoch)) return false;
    if (Math.floor(Date.now() / 1000) > expiresEpoch) return false;
    const expected = this.sign(storageKey, expiresEpoch);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private sign(storageKey: string, expiresEpoch: number): string {
    return crypto
      .createHmac('sha256', this.signedUrlSecret)
      .update(`${storageKey}:${expiresEpoch}`)
      .digest('hex');
  }
}
