/**
 * Private storage for candidate profile photos.
 *
 * Photos live in a dedicated private prefix and are NEVER served from a
 * public bucket. Objects use opaque, unguessable keys; access goes through
 * the authenticated owner endpoint only. Local filesystem in dev/test with
 * the same key contract as the MinIO/S3 production backend.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export const CANDIDATE_PHOTO_BUCKET = 'nexthire-candidate-photos';

@Injectable()
export class CandidatePhotoStorageService implements OnModuleInit {
  private readonly logger = new Logger(CandidatePhotoStorageService.name);
  private readonly storageDir: string;

  constructor(configService: ConfigService) {
    const basePath = configService.get<string>('STORAGE_LOCAL_PATH', './storage');
    this.storageDir = path.resolve(basePath, CANDIDATE_PHOTO_BUCKET);
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    this.logger.log(`Candidate photo storage initialized at ${this.storageDir}`);
  }

  generateKey(userId: string): string {
    const random = crypto.randomBytes(24).toString('hex');
    return `photos/${userId}/${random}`;
  }

  private resolveSafePath(storageKey: string): string {
    const resolved = path.resolve(this.storageDir, storageKey);
    const root = path.resolve(this.storageDir);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    return resolved;
  }

  async put(storageKey: string, buffer: Buffer): Promise<void> {
    const resolved = this.resolveSafePath(storageKey);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, buffer, { mode: 0o600 });
  }

  async read(storageKey: string): Promise<Buffer> {
    return fs.readFile(this.resolveSafePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.resolveSafePath(storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}
