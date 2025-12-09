---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/providers.ts
---
import { Provider } from '@nestjs/common';
import { <%= entityUpperSnake %>_REPO_PROVIDER } from './constants';
import { I<%= entityPascal %>Repository } from './interfaces';
import { <%= entityPascal %>Repository } from './repositories';

export const <%= entityPascal %>RepositoryProvider: Provider<I<%= entityPascal %>Repository> = {
  provide: <%= entityUpperSnake %>_REPO_PROVIDER,
  useClass: <%= entityPascal %>Repository,
};
