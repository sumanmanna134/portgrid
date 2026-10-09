import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  // Enterprise Bank-Grade HTTP Security Headers Middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*",
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  // Enable CORS for frontend dashboard
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Serve static frontend UI if present (for single-container Docker or production release)
  const candidateFrontendDirs = [
    process.env.FRONTEND_DIR,
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
    path.join(process.cwd(), '..', 'frontend', 'dist'),
    path.join(process.cwd(), 'public'),
    path.join(__dirname, 'public'),
  ].filter(Boolean) as string[];

  const staticDir = candidateFrontendDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html')));
  if (staticDir) {
    logger.log(`Serving unified frontend UI from: ${staticDir}`);
    expressApp.use(express.static(staticDir));
    expressApp.get('*', (req: any, res: any, next: any) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`PortGrid Control Plane is running on http://localhost:${port}`);
  logger.log(`Catalog API: http://localhost:${port}/api/catalog`);
  logger.log(`Services API: http://localhost:${port}/api/services`);
  logger.log(`=======================================================`);
}

bootstrap();
