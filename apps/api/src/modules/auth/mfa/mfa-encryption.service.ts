import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'node:crypto';

/**
 * AES-256-GCM encryption for TOTP secrets at rest.
 *
 * Key source: MFA_SECRET_ENCRYPTION_KEY (base64 or hex, 32 bytes).
 * When absent, a key is derived from AUTH_ACCESS_TOKEN_SECRET so local
 * development works without extra configuration; production must set a
 * dedicated key.
 *
 * Ciphertext format (versioned for future rotation):
 *   base64(iv[12] || authTag[16] || ciphertext)
 */
export const MFA_SECRET_ENCRYPTION_VERSION = 1;

@Injectable()
export class MfaEncryptionService {
  private readonly logger = new Logger(MfaEncryptionService.name);
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('MFA_SECRET_ENCRYPTION_KEY');

    if (configured) {
      this.key = this.parseKey(configured);
    } else {
      const fallbackSource = this.configService.get<string>(
        'AUTH_ACCESS_TOKEN_SECRET',
        'local-dev-secret-min-32-chars!!',
      );
      this.key = crypto.createHash('sha256').update(`mfa-secret:${fallbackSource}`).digest();
      this.logger.warn(
        'MFA_SECRET_ENCRYPTION_KEY is not set; deriving a key from AUTH_ACCESS_TOKEN_SECRET. Set a dedicated key in production.',
      );
    }
  }

  private parseKey(value: string): Buffer {
    if (/^[a-f0-9]{64}$/i.test(value)) {
      return Buffer.from(value, 'hex');
    }
    const decoded = Buffer.from(value, 'base64');
    if (decoded.length !== 32) {
      throw new Error('MFA_SECRET_ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
    return decoded;
  }

  encrypt(plaintext: string): { ciphertext: string; version: number } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: Buffer.concat([iv, authTag, encrypted]).toString('base64'),
      version: MFA_SECRET_ENCRYPTION_VERSION,
    };
  }

  decrypt(ciphertext: string, version: number): string {
    if (version !== MFA_SECRET_ENCRYPTION_VERSION) {
      throw new Error(`Unsupported MFA secret encryption version: ${version}`);
    }
    const payload = Buffer.from(ciphertext, 'base64');
    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}
