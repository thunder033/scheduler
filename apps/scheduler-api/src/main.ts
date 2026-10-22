import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

const GLOBAL_PREFIX = 'api';
const DEFAULT_PORT = 3000;
const DEFAULT_SCHEDULER_UI_ORIGIN = 'http://localhost:4200';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableCors({
    origin: process.env['SCHEDULER_UI_ORIGIN'] || DEFAULT_SCHEDULER_UI_ORIGIN,
  });
  const port = process.env['PORT'] || DEFAULT_PORT;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
  );
}

bootstrap();
