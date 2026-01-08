import { DynamicModule, Module, Provider } from "@nestjs/common";
import { AuthModuleOptions, AuthModuleAsyncOptions } from "./interfaces";
import { AUTH_MODULE_OPTIONS } from "./constants";
import { JweTokenService } from "./services";
import {
  JweAuthGuard,
  RolesGuard,
  ApiKeyGuard,
  ApiKeyOrJweGuard,
} from "./guards";
import { FirebaseService } from "./firebase/firebase.service";
import { FIREBASE_OPTIONS } from "./firebase/firebase.constants";

@Module({})
export class AuthModule {
  /**
   * Configure AuthModule with async options (recommended)
   * Allows injection of ConfigService for environment-based configuration
   */
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: AUTH_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      // Firebase options provider - extract Firebase config from AuthModuleOptions
      {
        provide: FIREBASE_OPTIONS,
        useFactory: (authOptions: AuthModuleOptions) => ({
          projectId: authOptions.firebaseProjectId || "",
          clientEmail: authOptions.firebaseClientEmail || "",
          privateKey: authOptions.firebasePrivateKey || "",
        }),
        inject: [AUTH_MODULE_OPTIONS],
      },
      JweTokenService,
      JweAuthGuard,
      RolesGuard,
      ApiKeyGuard,
      ApiKeyOrJweGuard,
      FirebaseService,
    ];

    return {
      module: AuthModule,
      global: true,
      providers,
      exports: [
        JweTokenService,
        JweAuthGuard,
        RolesGuard,
        ApiKeyGuard,
        ApiKeyOrJweGuard,
        FirebaseService,
      ],
    };
  }

  /**
   * Configure AuthModule with static options (for simple use cases)
   */
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      providers: [
        {
          provide: AUTH_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: FIREBASE_OPTIONS,
          useValue: {
            projectId: options.firebaseProjectId || "",
            clientEmail: options.firebaseClientEmail || "",
            privateKey: options.firebasePrivateKey || "",
          },
        },
        JweTokenService,
        JweAuthGuard,
        RolesGuard,
        ApiKeyGuard,
        ApiKeyOrJweGuard,
        FirebaseService,
      ],
      exports: [
        JweTokenService,
        JweAuthGuard,
        RolesGuard,
        ApiKeyGuard,
        ApiKeyOrJweGuard,
        FirebaseService,
      ],
    };
  }
}
