import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAppConfigService,
  RedisConfig,
  KafkaConfig,
  SmtpConfig,
} from '../interfaces';

@Injectable()
export class AppConfigService implements IAppConfigService {
  constructor(private configService: ConfigService) {}

  // App config
  getDbUrl(): string {
    return this.configService.get<string>('app_config.dbUrl');
  }

  getServicePort(): number {
    return this.configService.get<number>('app_config.servicePort');
  }

  getServiceHost(): string {
    return this.configService.get<string>('app_config.serviceHost');
  }

  getHealthPort(): number {
    return this.configService.get<number>('app_config.healthPort');
  }

  // Redis config
  getRedisConfig(): RedisConfig {
    return {
      url: this.configService.get<string>('app_config.redisUrl'),
      host: this.configService.get<string>('app_config.redisHost'),
      port: this.configService.get<number>('app_config.redisPort'),
      password: this.configService.get<string>('app_config.redisPassword'),
    };
  }

  // Kafka config
  getKafkaConfig(): KafkaConfig {
    const saslMechanism = this.configService.get<string>(
      'app_config.kafkaSaslMechanism',
    );
    const saslUsername = this.configService.get<string>(
      'app_config.kafkaSaslUsername',
    );
    const saslPassword = this.configService.get<string>(
      'app_config.kafkaSaslPassword',
    );

    return {
      clientId: this.configService.get<string>('app_config.kafkaClientId'),
      brokers: this.configService.get<string[]>('app_config.kafkaBrokers'),
      consumerGroup: this.configService.get<string>(
        'app_config.kafkaConsumerGroup',
      ),
      ssl: this.configService.get<boolean>('app_config.kafkaSsl'),
      sasl:
        saslMechanism && saslUsername && saslPassword
          ? ({
              mechanism: saslMechanism.toLowerCase(),
              username: saslUsername,
              password: saslPassword,
            } as import('kafkajs').SASLOptions)
          : undefined,
    };
  }

  // SMTP config
  getSmtpConfig(): SmtpConfig {
    return {
      host: this.configService.get<string>('app_config.smtpHost'),
      port: this.configService.get<number>('app_config.smtpPort'),
      secure: this.configService.get<boolean>('app_config.smtpSecure'),
      user: this.configService.get<string>('app_config.smtpUser'),
      password: this.configService.get<string>('app_config.smtpPassword'),
      from: this.configService.get<string>('app_config.smtpFrom'),
    };
  }
}
