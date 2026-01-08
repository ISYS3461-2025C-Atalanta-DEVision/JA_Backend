import { SASLOptions } from "kafkajs";

export interface RedisConfig {
  url?: string;
  host: string;
  port: number;
  password?: string;
}

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  consumerGroup: string;
  ssl?: boolean;
  sasl?: SASLOptions;
}

export interface SmtpConfig {
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

export interface IAppConfigService {
  // App config
  getDbUrl(): string;
  getServicePort(): number;
  getServiceHost(): string;
  getHealthPort(): number;

  // Redis config
  getRedisConfig(): RedisConfig;

  // Kafka config
  getKafkaConfig(): KafkaConfig;

  // SMTP config
  getSmtpConfig(): SmtpConfig;
}
