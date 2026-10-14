import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
  });
  app.enableShutdownHooks();

  await app.listen(Number(process.env.PORT ?? 3001), '127.0.0.1');

  console.log('Backend running at http://localhost:3001');
}

bootstrap().catch(() => {
  console.error('Backend startup failed. Check database configuration and startup logs.');
  process.exitCode = 1;
});
