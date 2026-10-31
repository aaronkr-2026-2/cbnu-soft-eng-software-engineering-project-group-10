import { json } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { runtimeConfig } from './config/runtime.config.js';
import { httpConfig } from './config/http.config.js';

async function bootstrap() {
  const config = httpConfig();
  const runtime = runtimeConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.getHttpAdapter().getInstance().set('trust proxy', runtime.proxies);
  let active = 0;
  app.use(
    (_req: unknown, res: import('express').Response, next: () => void) => {
      if (active >= 64) {
        res.setHeader('Retry-After', '2');
        res.status(503).json({ statusCode: 503, message: 'Server busy' });
        return;
      }
      active++;
      res.once('close', () => {
        active--;
      });
      next();
    },
  );
  app.use(json({ limit: '32kb', inflate: false }));
  app.use(
    (_req: unknown, res: import('express').Response, next: () => void) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
  );
  app.enableCors({ ...config.cors, exposedHeaders: ['Retry-After'] });
  app.enableShutdownHooks();

  await app.listen(config.port, runtime.host);

  const server = app.getHttpServer();
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  console.log(`Backend running at http://${runtime.host}:${config.port}`);
}

bootstrap().catch(() => {
  console.error(
    'Backend startup failed. Check database configuration and startup logs.',
  );
  process.exitCode = 1;
});
