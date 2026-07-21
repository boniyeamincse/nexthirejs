import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  const globalPrefix = configService.get<string>('API_GLOBAL_PREFIX', 'api');
  const defaultVersion = configService.get<string>('API_DEFAULT_VERSION', '1');
  const host = configService.get<string>('API_HOST', '0.0.0.0');
  const port = configService.get<number>('API_PORT', 3001);

  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.use(helmet());

  const bodyLimit = configService.get<string>('API_BODY_LIMIT', '1mb');
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: true });

  const corsOrigins = configService.get<string>('API_CORS_ORIGINS', '');
  const allowedOrigins = corsOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'test') {
    Logger.warn(
      'CORS allowlist is empty. In development, set API_CORS_ORIGINS. In production, requests with an Origin header will be rejected.',
      'Bootstrap',
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'Idempotency-Key',
    ],
  });

  app.enableShutdownHooks();

  const swaggerEnabled =
    configService.get<string>('API_DOCS_ENABLED', 'true') === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('NextHire API')
      .setDescription('NextHire career readiness and hiring platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer('/api/v1')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, host);

  Logger.log(
    `Application is running on: http://${host}:${port}/${globalPrefix}/v${defaultVersion}`,
    'Bootstrap',
  );
  if (swaggerEnabled) {
    Logger.log(
      `Swagger documentation: http://${host}:${port}/api/docs`,
      'Bootstrap',
    );
  }
}
void bootstrap();
