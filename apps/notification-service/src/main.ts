import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { APP_CONFIG_SERVICE_PROVIDER, IAppConfigService } from './libs';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  // Create HTTP application (for health checks)
  const app = await NestFactory.create(AppModule);

  // Get config service
  const appConfigService = app.get<IAppConfigService>(
    APP_CONFIG_SERVICE_PROVIDER,
  );
  const kafkaConfig = appConfigService.getKafkaConfig();
  const healthPort = appConfigService.getHealthPort();

  // Connect Kafka microservice for consuming events
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaConfig.clientId,
        brokers: kafkaConfig.brokers,
        ssl: kafkaConfig.ssl,
        sasl: kafkaConfig.sasl,
      },
      consumer: {
        groupId: kafkaConfig.consumerGroup,
      },
    },
  });

  // Start all microservices
  await app.startAllMicroservices();
  logger.log('Kafka consumer started');

  // Start HTTP server for health checks
  await app.listen(healthPort, '0.0.0.0');
  logger.log(`Health endpoint available at http://0.0.0.0:${healthPort}/health`);
}

bootstrap();
