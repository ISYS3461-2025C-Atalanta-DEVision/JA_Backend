export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  consumerGroup: string;
  ssl?: boolean;
  sasl?: {
    mechanism: "plain" | "scram-sha-256" | "scram-sha-512";
    username: string;
    password: string;
  };
}

export interface IAppConfigService {
  getDbUrl(): string;
  getServicePort(): number;
  getServiceHost(): string;
  getHealthPort(): number;
  getKafkaConfig(): KafkaConfig;
}
