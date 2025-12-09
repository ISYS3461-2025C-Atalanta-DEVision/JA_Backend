---
to: apps/<%= kebabName %>/src/apps/web/providers.ts
---
import { Provider } from '@nestjs/common';
import { <%= entityUpperSnake %>_SERVICE_WEB_PROVIDER } from './constants';
import { <%= entityPascal %>Service } from './services';
import { I<%= entityPascal %>Service } from './interfaces';

export const <%= entityPascal %>ServiceWebProvider: Provider<I<%= entityPascal %>Service> = {
  provide: <%= entityUpperSnake %>_SERVICE_WEB_PROVIDER,
  useClass: <%= entityPascal %>Service,
};
