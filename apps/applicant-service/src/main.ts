import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { APP_CONFIG_SERVICE_PROVIDER, IAppConfigService } from './libs';

async function bootstrap() {
  const logger = new Logger('ApplicantService');


  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.APPLICANT_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.APPLICANT_SERVICE_PORT || '3002', 10),
      },
    },
  );



  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();
  logger.log(`Applicant microservice is listening on TCP port ${process.env.APPLICANT_SERVICE_PORT || 3002}`);
}

bootstrap();
