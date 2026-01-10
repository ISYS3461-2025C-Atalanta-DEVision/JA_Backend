import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app_config', () => ({
  dbUrl: process.env.DB_URL,
  // Service ports
  servicePort: parseInt(process.env.WORK_HISTORY_SERVICE_PORT || "3008", 10),
  serviceHost: process.env.WORK_HISTORY_SERVICE_HOST || "0.0.0.0",
  healthPort: parseInt(process.env.HEALTH_PORT || "3018", 10),

  // Applicant Service (TCP)
  applicantServiceHost: process.env.APPLICANT_SERVICE_HOST || "localhost",
  applicantServicePort: parseInt(
    process.env.APPLICANT_SERVICE_PORT || "3002",
    10,
  ),

  // Kafka
  kafkaClientId: process.env.KAFKA_CLIENT_ID || "ja-notification-service",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaConsumerGroup:
    process.env.KAFKA_CONSUMER_GROUP_APPLICATION || "ja-job-application-group",
  // SASL config - enable when security protocol is set
  kafkaSsl: process.env.KAFKA_SECURITY_PROTOCOL === "SASL_SSL",
  kafkaSaslMechanism: process.env.KAFKA_SASL_MECHANISM,
  kafkaSaslUsername: process.env.KAFKA_SASL_USERNAME,
  kafkaSaslPassword: process.env.KAFKA_SASL_PASSWORD,
}));
