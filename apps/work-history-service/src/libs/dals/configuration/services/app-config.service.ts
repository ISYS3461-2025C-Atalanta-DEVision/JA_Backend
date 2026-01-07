import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAppConfigService } from '../interfaces';

@Injectable()
export class AppConfigService implements IAppConfigService {
  constructor(private configService: ConfigService) { }

  getDbUrl(): string {
    return this.configService.get<string>('DB_URL');
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
}
