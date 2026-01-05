import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  // Create HTTP application (for health checks)
  const app = await NestFactory.create(AppModule);

  // Connect Kafka microservice for consuming events
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'ja-notification-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      },
      consumer: {
        groupId: process.env.KAFKA_CONSUMER_GROUP_NOTIFICATION || 'ja-notification-group',
      },
    },
  });

  // Connect TCP microservice for API Gateway communication
  const tcpPort = parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3005', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.NOTIFICATION_SERVICE_HOST || '0.0.0.0',
      port: tcpPort,
    },
  });

  // Start all microservices (Kafka consumer + TCP)
  await app.startAllMicroservices();
  logger.log('Kafka consumer started');
  logger.log(`TCP microservice listening on port ${tcpPort}`);

  // Start HTTP server for health checks
  const healthPort = parseInt(process.env.NOTIFICATION_SERVICE_HEALTH_PORT || '3015', 10);
  await app.listen(healthPort, '0.0.0.0');
  logger.log(`Health endpoint available at http://0.0.0.0:${healthPort}/health`);
}

bootstrap();
