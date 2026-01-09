// Re-export everything from dals except modules to avoid conflict
export {
  ConfigurationModule,
  MongodbModule,
  // MongoDB exports (Mongoose schemas)
  JobApplication,
  JobApplicationSchema,
  JobApplicationDocument,
  JobApplicationRepository,
  JobApplicationRepositoryProvider,
  JOB_APPLICATION_REPO_PROVIDER,
  MONGODB_PROVIDER,
  IJobApplicationRepository,
  IBaseMongoRepository,
  // Configuration exports
  APP_CONFIG_SERVICE_PROVIDER,
  IAppConfigService,
  AppConfigService,
  AppConfigServiceProvider,
} from './dals';

// Export dal modules
export { modules } from './imports';
