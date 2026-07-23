import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const server = app.getHttpServer();
  const router = server._events.request._router;
  const routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
  console.log(routes);
  await app.close();
}
main();
