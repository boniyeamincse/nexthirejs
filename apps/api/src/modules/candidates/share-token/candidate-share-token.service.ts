import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { CandidateShareTokenRepository } from './candidate-share-token.repository';

@Injectable()
export class CandidateShareTokenService {
  constructor(private readonly repository: CandidateShareTokenRepository) {}

  generateToken(): { rawToken: string; hash: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hash };
  }

  async validateToken(rawToken: string): Promise<string | null> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.repository.findByTokenHash(tokenHash);
    if (!record || !record.enabled) return null;
    return record.userId;
  }

  async rotateToken(userId: string): Promise<{ rawToken: string; rotatedAt: Date }> {
    const { rawToken, hash } = this.generateToken();
    await this.repository.upsert(userId, { tokenHash: hash, enabled: true });
    return { rawToken, rotatedAt: new Date() };
  }

  async setEnabled(userId: string, enabled: boolean): Promise<void> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      await this.repository.updateEnabled(userId, enabled);
    } else {
      const { hash } = this.generateToken();
      await this.repository.upsert(userId, { tokenHash: hash, enabled });
    }
  }

  async getStatus(userId: string): Promise<{ enabled: boolean; rotatedAt: Date | null } | null> {
    const record = await this.repository.findByUserId(userId);
    if (!record) return null;
    return { enabled: record.enabled, rotatedAt: record.rotatedAt };
  }
}
