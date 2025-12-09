export interface AuthModuleOptions {
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn?: string; // default: '30m'
  jwtRefreshExpiresIn?: string; // default: '7d'
  // Firebase Auth (replaces Google/Facebook OAuth)
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
}

export interface AuthModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: any[];
}
