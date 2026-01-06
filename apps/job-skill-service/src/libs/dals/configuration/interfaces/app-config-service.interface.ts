export interface IAppConfigService {
  getDbUrl(): string;
  getServicePort(): number;
  getServiceHost(): string;
  getHealthPort(): number;
}
