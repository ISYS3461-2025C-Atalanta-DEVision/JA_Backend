import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IAppConfigService } from "../interfaces";

@Injectable()
export class AppConfigService implements IAppConfigService {
  constructor(private configService: ConfigService) { }

  getDbUrl(): string {
    return this.configService.get<string>('DB_URL');
  }
}