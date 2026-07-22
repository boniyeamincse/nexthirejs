import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { DATA_EXPORT_BUCKET } from './storage.constants';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageDir: string;

  constructor(private readonly configService: ConfigService) {
    const basePath = this.configService.get<string>('STORAGE_LOCAL_PATH', './storage');
    this.storageDir = path.resolve(basePath, DATA_EXPORT_BUCKET);
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    this.logger.log(`Storage directory initialized at ${this.storageDir}`);
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.storageDir, key);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(this.storageDir))) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    const dir = path.dirname(resolved);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(resolved, buffer);
    this.logger.debug(`File uploaded: ${key} (${buffer.length} bytes)`);
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.storageDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getSize(key: string): Promise<number> {
    const filePath = path.join(this.storageDir, key);
    const stat = await fs.stat(filePath);
    return stat.size;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.storageDir, key);
    try {
      await fs.unlink(filePath);
      this.logger.debug(`File deleted: ${key}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  generateKey(userId: string, exportId: string): string {
    const randomPart = crypto.randomBytes(8).toString('hex');
    return `${userId}/${exportId}-${randomPart}.zip`;
  }

  async getPresignedUrl(
    key: string,
    expiresInSeconds: number,
  ): Promise<{ url: string; expiresInSeconds: number }> {
    const filePath = path.join(this.storageDir, key);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(this.storageDir))) {
      throw new Error('Invalid storage key');
    }
    return {
      url: `file://${resolved}`,
      expiresInSeconds,
    };
  }

  async cleanupExpired(): Promise<number> {
    return 0;
  }
}
