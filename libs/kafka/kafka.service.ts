import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Producer, ProducerRecord, RecordMetadata } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>(
      "KAFKA_BROKERS",
      "localhost:9092",
    );
    const clientId = this.configService.get<string>(
      "KAFKA_CLIENT_ID",
      "ja-core",
    );

    // Check if using SASL authentication (Confluent Cloud)
    const saslMechanism = this.configService.get<string>(
      "KAFKA_SASL_MECHANISM",
    );
    const saslUsername = this.configService.get<string>("KAFKA_SASL_USERNAME");
    const saslPassword = this.configService.get<string>("KAFKA_SASL_PASSWORD");
    const securityProtocol = this.configService.get<string>(
      "KAFKA_SECURITY_PROTOCOL",
    );

    const kafkaConfig: any = {
      clientId,
      brokers: brokers.split(","),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };

    // Add SASL config if credentials are provided
    if (saslMechanism && saslUsername && saslPassword) {
      kafkaConfig.ssl = securityProtocol === "SASL_SSL";
      kafkaConfig.sasl = {
        mechanism: saslMechanism.toLowerCase(),
        username: saslUsername,
        password: saslPassword,
      };
    }

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log("Kafka producer connected");
    } catch (error) {
      this.logger.error("Failed to connect Kafka producer", error);
      // Don't throw - allow app to start without Kafka
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.logger.log("Kafka producer disconnected");
    }
  }

  /**
   * Publish an event to a Kafka topic
   * Sends raw payload without envelope wrapper
   */
  async publish<T>(
    topic: string,
    eventType: string,
    payload: T,
    options?: {
      key?: string;
      headers?: Record<string, string>;
    },
  ): Promise<RecordMetadata[] | null> {
    if (!this.isConnected) {
      this.logger.warn(`Kafka not connected. Skipping publish to ${topic}`);
      return null;
    }

    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key: options?.key,
          value: JSON.stringify(payload),
          headers: options?.headers,
        },
      ],
    };

    try {
      const result = await this.producer.send(record);
      this.logger.debug(`Published event to ${topic}: ${eventType}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish to ${topic}`, error);
      throw error;
    }
  }

  /**
   * Publish multiple messages in a batch
   * Sends raw payloads without envelope wrapper
   */
  async publishBatch<T>(
    messages: Array<{
      topic: string;
      key?: string;
      payload: T;
      headers?: Record<string, string>;
    }>,
  ): Promise<RecordMetadata[] | null> {
    if (!this.isConnected) {
      this.logger.warn("Kafka not connected. Skipping batch publish");
      return null;
    }

    const topicMessages = messages.reduce(
      (acc, msg) => {
        if (!acc[msg.topic]) {
          acc[msg.topic] = [];
        }

        acc[msg.topic].push({
          key: msg.key,
          value: JSON.stringify(msg.payload),
          headers: msg.headers,
        });

        return acc;
      },
      {} as Record<string, any[]>,
    );

    try {
      const results: RecordMetadata[] = [];

      for (const [topic, msgs] of Object.entries(topicMessages)) {
        const result = await this.producer.send({
          topic,
          messages: msgs,
        });
        results.push(...result);
      }

      this.logger.debug(`Published batch of ${messages.length} messages`);
      return results;
    } catch (error) {
      this.logger.error("Failed to publish batch", error);
      throw error;
    }
  }

  /**
   * Get the Kafka instance for creating consumers
   */
  getKafkaInstance(): Kafka {
    return this.kafka;
  }

  /**
   * Check if producer is connected
   */
  isProducerConnected(): boolean {
    return this.isConnected;
  }
}
