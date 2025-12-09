---
to: apps/<%= kebabName %>/src/main.ts
---
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('<%= pascalName %>');

  // Create HTTP application (for health checks)
  const app = await NestFactory.create(AppModule);

  // Connect TCP microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.<%= serviceEnvPrefix %>_PORT || '<%= port %>', 10),
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Start all microservices (TCP)
  await app.startAllMicroservices();
  logger.log(`TCP microservice listening on port ${process.env.<%= serviceEnvPrefix %>_PORT || <%= port %>}`);

  // Start HTTP server for health checks
  const healthPort = parseInt(process.env.HEALTH_PORT || '<%= healthPort %>', 10);
  await app.listen(healthPort);
  logger.log(`Health endpoint available at http://0.0.0.0:${healthPort}/health`);
}

bootstrap();
