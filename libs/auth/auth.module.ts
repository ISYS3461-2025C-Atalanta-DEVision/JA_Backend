import { DynamicModule, Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModuleOptions, AuthModuleAsyncOptions } from './interfaces';
import { AUTH_MODULE_OPTIONS } from './constants';
import { TokenService } from './services';
import { JwtStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';
import { FirebaseService } from './firebase/firebase.service';
import { FIREBASE_OPTIONS } from './firebase/firebase.constants';

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
          projectId: authOptions.firebaseProjectId || '',
          clientEmail: authOptions.firebaseClientEmail || '',
          privateKey: authOptions.firebasePrivateKey || '',
        }),
        inject: [AUTH_MODULE_OPTIONS],
      },
      TokenService,
      JwtStrategy,
      JwtAuthGuard,
      RolesGuard,
      FirebaseService,
    ];

    return {
      module: AuthModule,
      global: true,
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({}), // JWT options provided per-token in TokenService
      ],
      providers,
      exports: [
        TokenService,
        JwtAuthGuard,
        RolesGuard,
        PassportModule,
        JwtModule,
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
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({}),
      ],
      providers: [
        {
          provide: AUTH_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: FIREBASE_OPTIONS,
          useValue: {
            projectId: options.firebaseProjectId || '',
            clientEmail: options.firebaseClientEmail || '',
            privateKey: options.firebasePrivateKey || '',
          },
        },
        TokenService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        FirebaseService,
      ],
      exports: [
        TokenService,
        JwtAuthGuard,
        RolesGuard,
        PassportModule,
        JwtModule,
        FirebaseService,
      ],
    };
  }
}
