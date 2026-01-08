import { NestFactory } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { APP_CONFIG_SERVICE_PROVIDER, IAppConfigService } from "./libs";

async function bootstrap() {
  const logger = new Logger("ApplicantService");

  // Create HTTP application (for health checks)
  const app = await NestFactory.create(AppModule);

  // Get config service
  const appConfigService = app.get<IAppConfigService>(
    APP_CONFIG_SERVICE_PROVIDER,
  );
  const servicePort = appConfigService.getServicePort();
  const serviceHost = appConfigService.getServiceHost();
  const healthPort = appConfigService.getHealthPort();

  // Connect TCP microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: serviceHost,
      port: servicePort,
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
  logger.log(`TCP microservice listening on port ${servicePort}`);

  // Start HTTP server for health checks
  await app.listen(healthPort, "0.0.0.0");
  logger.log(
    `Health endpoint available at http://0.0.0.0:${healthPort}/health`,
  );
}

bootstrap();
