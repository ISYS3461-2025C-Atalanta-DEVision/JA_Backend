// Re-export everything from dals except modules to avoid conflict
export {
  ConfigurationModule,
  MongodbModule,
  // MongoDB exports (Mongoose schemas)
  Applicant,
  ApplicantSchema,
  ApplicantDocument,
  OAuthAccount,
  OAuthAccountSchema,
  OAuthAccountDocument,
  ApplicantRepository,
  OAuthAccountRepository,
  ApplicantRepositoryProvider,
  OAuthAccountRepositoryProvider,
  APPLICANT_REPO_PROVIDER,
  OAUTH_ACCOUNT_REPO_PROVIDER,
  MONGODB_PROVIDER,
  IApplicantRepository,
  IOAuthAccountRepository,
  IBaseMongoRepository,
  TokenData,
  // Configuration exports
  APP_CONFIG_SERVICE_PROVIDER,
  IAppConfigService,
  AppConfigService,
  AppConfigServiceProvider,
} from './dals';

// Export dal modules
export { modules } from './imports'
