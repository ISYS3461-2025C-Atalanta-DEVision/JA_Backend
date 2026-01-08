export interface FirebaseModuleOptions {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<FirebaseModuleOptions> | FirebaseModuleOptions;
  inject?: any[];
}
