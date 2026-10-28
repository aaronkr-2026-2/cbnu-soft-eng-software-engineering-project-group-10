import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { httpConfig } from './config/http.config.js';

async function bootstrap() {
  const config = httpConfig();
  const app = await NestFactory.create(AppModule);

  app.enableCors(config.cors);
  app.enableShutdownHooks();

  await app.listen(config.port, '127.0.0.1');

  console.log(`Backend running at http://127.0.0.1:${config.port}`);
}

bootstrap().catch(() => {
  console.error(
    'Backend startup failed. Check database configuration and startup logs.',
  );
  process.exitCode = 1;
});
