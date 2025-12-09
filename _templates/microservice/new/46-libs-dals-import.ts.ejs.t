---
to: apps/<%= kebabName %>/src/libs/dals/import.ts
---
import { ConfigurationModule, MongodbModule } from './';

export const modules = [
  ConfigurationModule,
  MongodbModule
];
