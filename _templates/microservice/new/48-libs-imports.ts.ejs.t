---
to: apps/<%= kebabName %>/src/libs/imports.ts
---
import { ConfigurationModule, MongodbModule } from './dals';

export const modules = [
  ConfigurationModule,
  MongodbModule
];
