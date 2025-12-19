import { DynamicModule, Module } from '@nestjs/common';
import { StorageService, STORAGE_CONFIG } from './storage.service';
import { StorageModuleConfig, StorageModuleAsyncOptions } from './interfaces';

@Module({})
export class StorageModule {
  /**
   * Configure StorageModule with async options (recommended)
   * Allows injection of ConfigService for environment-based configuration
   */
  static forRootAsync(options: StorageModuleAsyncOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      providers: [
        {
          provide: STORAGE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }

  /**
   * Configure StorageModule with static options
   */
  static forRoot(config: StorageModuleConfig): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: STORAGE_CONFIG,
          useValue: config,
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
