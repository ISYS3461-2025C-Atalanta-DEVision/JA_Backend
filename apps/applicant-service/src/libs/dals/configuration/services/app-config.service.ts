import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAppConfigService, KafkaConfig } from '../interfaces';

@Injectable()
export class AppConfigService implements IAppConfigService {
  constructor(private configService: ConfigService) {}

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
          ? {
              mechanism: saslMechanism.toLowerCase() as
                | 'plain'
                | 'scram-sha-256'
                | 'scram-sha-512',
              username: saslUsername,
              password: saslPassword,
            }
          : undefined,
    };
  }
}
