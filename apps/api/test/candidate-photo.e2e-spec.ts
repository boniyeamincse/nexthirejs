/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// supertest response bodies are typed `any`; assertions below validate shape at runtime.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

jest.setTimeout(30000);

const EMAIL_PREFIX = 'e2e-photo-';

/** Minimal valid 1x1 PNG. */
const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6260000000060005' +
    '57bfabd40000000049454e44ae426082',
  'hex',
);

/** JPEG magic bytes followed by filler — enough for signature detection. */
const JPEG_BYTES = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);

/** PDF header — a disallowed type for photos. */
const PDF_BYTES = Buffer.from('%PDF-1.4 fake content');

describe('Candidate Photo (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  async function cleanup() {
    await prismaService.user.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['../../.env', '.env'],
          ignoreEnvFile: process.env.NODE_ENV === 'test',
        }),
        AppModule,
      ],
    })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const password = 'StrongP@ss1';

  async function createCandidate(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({ email, password, confirmPassword: password, acceptTerms: true })
      .expect(201);

    const user = await prismaService.user.findUnique({ where: { email } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    await prismaService.emailVerificationToken.create({
      data: {
        userId: user!.id,
        tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return login.body.accessToken as string;
  }

  async function createProfile(accessToken: string, fullName: string): Promise<void> {
    await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName })
      .expect(200);
  }

  let accessToken: string;

  beforeAll(async () => {
    accessToken = await createCandidate(`${EMAIL_PREFIX}owner@example.com`);
  });

  it('requires authentication for all photo endpoints', async () => {
    await request(app.getHttpServer()).get('/api/v1/candidates/me/profile/photo').expect(401);
    await request(app.getHttpServer()).put('/api/v1/candidates/me/profile/photo').expect(401);
    await request(app.getHttpServer()).delete('/api/v1/candidates/me/profile/photo').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo/status')
      .expect(401);
  });

  it('rejects upload before the profile exists', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', PNG_BYTES, { filename: 'photo.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('CANDIDATE_PROFILE_REQUIRED_FOR_PHOTO');
  });

  it('reports no photo initially', async () => {
    await createProfile(accessToken, 'Photo Owner');

    const res = await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.hasPhoto).toBe(false);

    await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('rejects a file whose content is not JPEG/PNG regardless of declared type', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', PDF_BYTES, { filename: 'photo.png', contentType: 'image/png' });
    expect(res.status).toBe(415);
    expect(res.body.message).toBe('CANDIDATE_PHOTO_TYPE_UNSUPPORTED');
  });

  it('rejects an oversized photo', async () => {
    const big = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(2 * 1024 * 1024, 2),
    ]);
    const res = await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', big, { filename: 'big.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(413);
  });

  it('uploads a PNG and serves it back to the owner only', async () => {
    const upload = await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', PNG_BYTES, { filename: 'photo.png', contentType: 'image/png' })
      .expect(200);

    expect(upload.body.hasPhoto).toBe(true);
    expect(upload.body.mimeType).toBe('image/png');
    expect(upload.body.sizeBytes).toBe(PNG_BYTES.length);

    const photo = await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(photo.headers['content-type']).toContain('image/png');
    expect(photo.headers['cache-control']).toContain('no-store');
    expect(Buffer.compare(photo.body as Buffer, PNG_BYTES)).toBe(0);
  });

  it('stores an opaque storage key and never exposes it in responses', async () => {
    const user = await prismaService.user.findUnique({
      where: { email: `${EMAIL_PREFIX}owner@example.com` },
    });
    const profile = await prismaService.candidateProfile.findUnique({
      where: { userId: user!.id },
    });
    expect(profile!.photoStorageKey).toMatch(/^photos\//);

    const status = await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(JSON.stringify(status.body)).not.toContain(profile!.photoStorageKey);
  });

  it('replaces the photo and updates metadata', async () => {
    const upload = await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', JPEG_BYTES, { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(200);

    expect(upload.body.mimeType).toBe('image/jpeg');

    const photo = await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(photo.headers['content-type']).toContain('image/jpeg');
  });

  it("never serves another user their neighbour's photo (owner-scoped access)", async () => {
    const otherToken = await createCandidate(`${EMAIL_PREFIX}other@example.com`);
    await createProfile(otherToken, 'Other User');

    await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    const status = await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo/status')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(status.body.hasPhoto).toBe(false);
  });

  it('removes the photo and clears metadata', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    const status = await request(app.getHttpServer())
      .get('/api/v1/candidates/me/profile/photo/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(status.body.hasPhoto).toBe(false);
    expect(status.body.mimeType).toBeNull();

    await request(app.getHttpServer())
      .delete('/api/v1/candidates/me/profile/photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
