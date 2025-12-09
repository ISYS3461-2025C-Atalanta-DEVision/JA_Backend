---
to: apps/<%= kebabName %>/src/libs/dals/configuration/interfaces/app-config-service.interface.ts
---
export interface IAppConfigService {
  getDbUrl(): string;
}
