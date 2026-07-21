import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './../src/app.module';
import { AuditService } from './../src/modules/audit/audit.service';
import { PrismaService } from './../src/database/prisma.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

describe('Audit Database Integration (e2e)', () => {
  let app: INestApplication;
  let auditService: AuditService;
  let prismaService: PrismaService;

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
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    auditService = app.get<AuditService>(AuditService);
    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up test records
    await prismaService.auditLog.deleteMany({
      where: {
        action: { startsWith: 'test.integration.' },
      },
    });
  });

  afterAll(async () => {
    await prismaService.auditLog.deleteMany({
      where: {
        action: { startsWith: 'test.integration.' },
      },
    });
    await app.close();
  });

  it('should create an anonymous audit record', async () => {
    const requestId = 'e2e-anon-request-123';
    await auditService.recordRequired({
      action: 'test.integration.anon',
      actorType: AuditActorType.ANONYMOUS,
      requestId,
      metadata: { foo: 'bar' },
    });

    const record = await prismaService.auditLog.findFirst({
      where: { requestId, action: 'test.integration.anon' },
    });

    expect(record).toBeDefined();
    expect(record?.actorType).toBe(AuditActorType.ANONYMOUS);
    expect(record?.outcome).toBe(AuditOutcome.SUCCESS);
    expect(record?.actorUserId).toBeNull();
    // @ts-expect-error JSON object typing
    expect(record?.metadata?.foo).toBe('bar');
  });

  it('should create a user-actor audit record without requiring a user relation', async () => {
    const requestId = 'e2e-user-request-123';
    const fakeUserId = '00000000-0000-0000-0000-000000000000';

    await auditService.recordRequired({
      action: 'test.integration.user',
      actorType: AuditActorType.USER,
      actorUserId: fakeUserId,
      requestId,
      metadata: { password: 'should-be-redacted' },
    });

    const record = await prismaService.auditLog.findFirst({
      where: { requestId, action: 'test.integration.user' },
    });

    expect(record).toBeDefined();
    expect(record?.actorType).toBe(AuditActorType.USER);
    expect(record?.actorUserId).toBe(fakeUserId);
    // @ts-expect-error JSON object typing
    expect(record?.metadata?.password).toBe('[REDACTED]');
  });
});
