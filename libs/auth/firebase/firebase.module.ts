import { DynamicModule, Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { FIREBASE_OPTIONS } from "./firebase.constants";
import {
  FirebaseModuleOptions,
  FirebaseModuleAsyncOptions,
} from "./interfaces";

@Module({})
export class FirebaseModule {
  /**
   * Configure FirebaseModule with static options
   */
  static forRoot(options: FirebaseModuleOptions): DynamicModule {
    return {
      module: FirebaseModule,
      global: true,
      providers: [
        {
          provide: FIREBASE_OPTIONS,
          useValue: options,
        },
        FirebaseService,
      ],
      exports: [FirebaseService],
    };
  }

  /**
   * Configure FirebaseModule with async options (recommended)
   * Allows injection of ConfigService for environment-based configuration
   */
  static forRootAsync(options: FirebaseModuleAsyncOptions): DynamicModule {
    return {
      module: FirebaseModule,
      global: true,
      providers: [
        {
          provide: FIREBASE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        FirebaseService,
      ],
      exports: [FirebaseService],
    };
  }
}
