import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app_config', () => ({
  // Database
  dbUrl: process.env.DB_URL,

  // Service ports
  servicePort: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3005', 10),
  serviceHost: process.env.NOTIFICATION_SERVICE_HOST || '0.0.0.0',
  healthPort: parseInt(process.env.HEALTH_PORT || '3015', 10),

  // Kafka
  kafkaClientId: process.env.KAFKA_CLIENT_ID || 'ja-notification-service',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  kafkaConsumerGroup:
    process.env.KAFKA_CONSUMER_GROUP_NOTIFICATION || 'ja-notification-group',
  // SASL config - enable when security protocol is set
  kafkaSsl: process.env.KAFKA_SECURITY_PROTOCOL === 'SASL_SSL',
  kafkaSaslMechanism: process.env.KAFKA_SASL_MECHANISM,
  kafkaSaslUsername: process.env.KAFKA_SASL_USERNAME,
  kafkaSaslPassword: process.env.KAFKA_SASL_PASSWORD,

  // Redis
  redisUrl: process.env.REDIS_URL,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD,

  // SMTP
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM || 'noreply@example.com',

  // Applicant Service (TCP)
  applicantServiceHost: process.env.APPLICANT_SERVICE_HOST || 'localhost',
  applicantServicePort: parseInt(process.env.APPLICANT_SERVICE_PORT || '3002', 10),
}));
