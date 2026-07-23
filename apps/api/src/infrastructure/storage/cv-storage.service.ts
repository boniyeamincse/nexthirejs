import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes, createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class CvStorageService {
  private readonly logger = new Logger(CvStorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucket: string;
  private readonly useS3: boolean;
  private readonly localPath: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('CV_STORAGE_BUCKET', 'nexthire-cv-exports');
    this.useS3 = this.configService.get<string>('CV_STORAGE_TYPE', 'local') === 's3';
    this.localPath = this.configService.get<string>('CV_LOCAL_PATH', './storage/cv-exports');

    if (this.useS3) {
      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      const region = this.configService.get<string>('S3_REGION', 'us-east-1');
      const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        this.logger.warn('S3 credentials not fully configured, falling back to local storage');
      } else {
        this.s3Client = new S3Client({
          endpoint,
          region,
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: true,
        });
      }
    }
  }

  async onModuleInit() {
    if (!this.useS3 || !this.s3Client) {
      await fsp.mkdir(this.localPath, { recursive: true }).catch(() => {});
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
  ): Promise<{ checksumSha256: string; fileSizeBytes: number }> {
    const checksumSha256 = createHash('sha256').update(buffer).digest('hex');
    const fileSizeBytes = buffer.length;

    if (this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
          Metadata: { checksumSha256 },
        }),
      );
    } else {
      const filePath = path.join(this.localPath, key);
      await fsp.mkdir(path.dirname(filePath), { recursive: true });
      await fsp.writeFile(filePath, buffer);
    }

    return { checksumSha256, fileSizeBytes };
  }

  async getPresignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    if (this.s3Client) {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    }

    const filePath = path.join(this.localPath, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`CV export file not found: ${key}`);
    }
    return `/api/v1/cvs/exports/download-local/${path.basename(key)}`;
  }

  async exists(key: string): Promise<boolean> {
    if (this.s3Client) {
      try {
        await this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
        return true;
      } catch {
        return false;
      }
    }
    return fs.existsSync(path.join(this.localPath, key));
  }

  async read(key: string): Promise<Buffer | null> {
    if (this.s3Client) {
      const result = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (result.Body) {
        return Buffer.from(await result.Body.transformToByteArray());
      }
      return null;
    }
    const filePath = path.join(this.localPath, key);
    if (!fs.existsSync(filePath)) return null;
    return fsp.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    if (this.s3Client) {
      return;
    }
    const filePath = path.join(this.localPath, key);
    await fsp.unlink(filePath).catch(() => {});
  }

  generateKey(cvId: string, exportId: string): string {
    const random = randomBytes(16).toString('hex');
    return `cv-exports/${cvId}/${exportId}-${random}.pdf`;
  }
}
