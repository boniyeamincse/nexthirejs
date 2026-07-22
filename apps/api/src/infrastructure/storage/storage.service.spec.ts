import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let testBaseDir: string;

  beforeEach(async () => {
    testBaseDir = path.join(os.tmpdir(), `storage-test-${Date.now()}`);
    mockConfigService = {
      get: jest.fn().mockReturnValue(testBaseDir),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
    await storageService.onModuleInit();
  });

  afterEach(async () => {
    await fs.rm(testBaseDir, { recursive: true, force: true });
  });

  it('should initialize storage directory', async () => {
    const dirExists = await fs.stat(testBaseDir).then(
      () => true,
      () => false,
    );
    expect(dirExists).toBe(true);
  });

  it('should upload and store a file', async () => {
    const key = 'test/file.txt';
    const content = Buffer.from('hello world');
    await storageService.upload(key, content);

    const filePath = path.join(testBaseDir, 'nexthire-exports', key);
    const stored = await fs.readFile(filePath, 'utf-8');
    expect(stored).toBe('hello world');
  });

  it('should reject path traversal key', async () => {
    const key = '../../etc/passwd';
    const content = Buffer.from('evil');
    await expect(storageService.upload(key, content)).rejects.toThrow(
      'Invalid storage key: path traversal detected',
    );
  });

  it('should check file existence', async () => {
    const key = 'exists.txt';
    expect(await storageService.exists(key)).toBe(false);
    await storageService.upload(key, Buffer.from('data'));
    expect(await storageService.exists(key)).toBe(true);
  });

  it('should delete a file', async () => {
    const key = 'delete-me.txt';
    await storageService.upload(key, Buffer.from('data'));
    expect(await storageService.exists(key)).toBe(true);
    await storageService.delete(key);
    expect(await storageService.exists(key)).toBe(false);
  });

  it('should not throw when deleting non-existent file', async () => {
    await expect(storageService.delete('does-not-exist.txt')).resolves.not.toThrow();
  });

  it('should generate a unique key', async () => {
    const key1 = storageService.generateKey('user1', 'export1');
    const key2 = storageService.generateKey('user1', 'export1');
    expect(key1).toContain('user1/');
    expect(key1).toContain('export1-');
    expect(key1).toMatch(/\.zip$/);
    expect(key1).not.toBe(key2);
  });

  it('should return presigned URL', async () => {
    const key = 'presigned.txt';
    await storageService.upload(key, Buffer.from('data'));
    const result = await storageService.getPresignedUrl(key, 300);
    expect(result.url).toMatch(/^file:\/\//);
    expect(result.expiresInSeconds).toBe(300);
  });

  it('should get file size', async () => {
    const key = 'size.txt';
    const content = Buffer.from('12345');
    await storageService.upload(key, content);
    const size = await storageService.getSize(key);
    expect(size).toBe(5);
  });

  it('should return 0 from cleanupExpired', async () => {
    expect(await storageService.cleanupExpired()).toBe(0);
  });
});
