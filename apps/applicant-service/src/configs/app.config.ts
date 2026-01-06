import { registerAs } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = registerAs('app_config', () => ({
  // Database
  dbUrl: process.env.DB_URL,

  // Service ports
  servicePort: parseInt(process.env.APPLICANT_SERVICE_PORT || '3002', 10),
  serviceHost: process.env.APPLICANT_SERVICE_HOST || '0.0.0.0',
  healthPort: parseInt(process.env.HEALTH_PORT || '3012', 10),

  // Kafka
  kafkaClientId: process.env.KAFKA_CLIENT_ID || 'ja-applicant-service',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  kafkaConsumerGroup:
    process.env.KAFKA_CONSUMER_GROUP_APPLICANT || 'ja-applicant-group',
  // SASL config for Confluent Cloud (production only)
  kafkaSsl: process.env.KAFKA_SECURITY_PROTOCOL === 'SASL_SSL',
  kafkaSaslMechanism: process.env.KAFKA_SASL_MECHANISM,
  kafkaSaslUsername: process.env.KAFKA_SASL_USERNAME,
  kafkaSaslPassword: process.env.KAFKA_SASL_PASSWORD,
}));
