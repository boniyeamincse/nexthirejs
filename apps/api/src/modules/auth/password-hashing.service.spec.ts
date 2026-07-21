import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHashingService } from './password-hashing.service';

describe('PasswordHashingService', () => {
  let service: PasswordHashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordHashingService],
    }).compile();

    service = module.get<PasswordHashingService>(PasswordHashingService);
  });

  describe('hash and verify', () => {
    it('should hash a password and verify it correctly', async () => {
      const password = 'StrongP@ss1';
      const hash = await service.hash(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$argon2id$')).toBe(true);

      const isValid = await service.verify(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await service.hash('CorrectP@ss1');
      const isValid = await service.verify(hash, 'WrongP@ss2');
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'StrongP@ss1';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });
});
