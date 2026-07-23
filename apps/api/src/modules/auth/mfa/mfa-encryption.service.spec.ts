import { ConfigService } from '@nestjs/config';
import { MfaEncryptionService, MFA_SECRET_ENCRYPTION_VERSION } from './mfa-encryption.service';

function buildService(env: Record<string, string> = {}): MfaEncryptionService {
  const configService = {
    get: (key: string, defaultValue?: string) => env[key] ?? defaultValue,
  } as unknown as ConfigService;
  return new MfaEncryptionService(configService);
}

describe('MfaEncryptionService', () => {
  it('round-trips a TOTP secret', () => {
    const service = buildService();
    const secret = 'JBSWY3DPEHPK3PXP';
    const { ciphertext, version } = service.encrypt(secret);

    expect(version).toBe(MFA_SECRET_ENCRYPTION_VERSION);
    expect(ciphertext).not.toContain(secret);
    expect(service.decrypt(ciphertext, version)).toBe(secret);
  });

  it('produces unique ciphertexts for the same plaintext', () => {
    const service = buildService();
    const first = service.encrypt('JBSWY3DPEHPK3PXP');
    const second = service.encrypt('JBSWY3DPEHPK3PXP');
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('rejects tampered ciphertext', () => {
    const service = buildService();
    const { ciphertext, version } = service.encrypt('JBSWY3DPEHPK3PXP');
    const tampered = Buffer.from(ciphertext, 'base64');
    tampered[tampered.length - 1] = (tampered[tampered.length - 1] ?? 0) ^ 0xff;
    expect(() => service.decrypt(tampered.toString('base64'), version)).toThrow();
  });

  it('rejects an unsupported encryption version', () => {
    const service = buildService();
    const { ciphertext } = service.encrypt('JBSWY3DPEHPK3PXP');
    expect(() => service.decrypt(ciphertext, 99)).toThrow('Unsupported');
  });

  it('accepts a dedicated 32-byte hex key', () => {
    const service = buildService({ MFA_SECRET_ENCRYPTION_KEY: 'ab'.repeat(32) });
    const { ciphertext, version } = service.encrypt('SECRETVALUE');
    expect(service.decrypt(ciphertext, version)).toBe('SECRETVALUE');
  });

  it('rejects a key that is not 32 bytes', () => {
    expect(() =>
      buildService({ MFA_SECRET_ENCRYPTION_KEY: Buffer.from('short').toString('base64') }),
    ).toThrow('32 bytes');
  });

  it('cannot decrypt with a different key', () => {
    const serviceA = buildService({ MFA_SECRET_ENCRYPTION_KEY: 'aa'.repeat(32) });
    const serviceB = buildService({ MFA_SECRET_ENCRYPTION_KEY: 'bb'.repeat(32) });
    const { ciphertext, version } = serviceA.encrypt('JBSWY3DPEHPK3PXP');
    expect(() => serviceB.decrypt(ciphertext, version)).toThrow();
  });
});
