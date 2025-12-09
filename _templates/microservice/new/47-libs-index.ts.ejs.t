---
to: apps/<%= kebabName %>/src/libs/index.ts
---
// Re-export everything from dals except modules to avoid conflict
export {
  ConfigurationModule,
  MongodbModule,
  // MongoDB exports (Mongoose schemas)
  <%= entityPascal %>,
  <%= entityPascal %>Schema,
  <%= entityPascal %>Document,
  <%= entityPascal %>Repository,
  <%= entityPascal %>RepositoryProvider,
  <%= entityUpperSnake %>_REPO_PROVIDER,
  MONGODB_PROVIDER,
  I<%= entityPascal %>Repository,
  IBaseMongoRepository,
  // Configuration exports
  APP_CONFIG_SERVICE_PROVIDER,
  IAppConfigService,
  AppConfigService,
  AppConfigServiceProvider,
} from './dals';

// Export dal modules
export { modules } from './imports';
