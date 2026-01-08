export interface AuthModuleOptions {
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn?: string; // default: '30m'
  jwtRefreshExpiresIn?: string; // default: '7d'
  // JWE encryption secrets (optional, falls back to JWT secrets)
  jweAccessSecret?: string;
  jweRefreshSecret?: string;
  // Firebase Auth (replaces Google/Facebook OAuth)
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
}

export interface AuthModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: any[];
}
