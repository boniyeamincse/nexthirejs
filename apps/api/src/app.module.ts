import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EmailModule } from './infrastructure/email/email.module';
import { HealthModule } from './health/health.module';
import { SystemModule } from './system/system.module';
import { RequestContextModule, RequestContextMiddleware } from './common/request-context';
import { AuthModule } from './modules/auth';
import { AuditModule } from './modules/audit';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { PublicModule } from './modules/public/public.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { ExpertsModule } from './modules/experts/experts.module';
import { CvModule } from './modules/cv/cv.module';
import { ProjectModule } from './modules/projects/project.module';
import { SkillModule } from './modules/skills/skill.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    RedisModule,
    QueueModule,
    EmailModule,
    HealthModule,
    SystemModule,
    RequestContextModule,
    AuthModule,
    AuditModule,
    ConfigurationModule,
    CandidatesModule,
    PublicModule,
    AssessmentsModule,
    ExpertsModule,
    CvModule,
    ProjectModule,
    SkillModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
