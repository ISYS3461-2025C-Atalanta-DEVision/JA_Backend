import { SASLOptions } from "kafkajs";

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  consumerGroup: string;
  ssl?: boolean;
  sasl?: SASLOptions;
}

export interface IAppConfigService {
  getDbUrl(): string;
  getServicePort(): number;
  getServiceHost(): string;
  getHealthPort(): number;
}
