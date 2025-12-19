export interface StorageModuleConfig {
  s3Bucket: string;
  s3Region: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnBaseUrl: string;
}

export interface StorageModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<StorageModuleConfig> | StorageModuleConfig;
  inject?: any[];
}
