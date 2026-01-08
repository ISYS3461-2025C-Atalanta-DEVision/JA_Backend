import { DynamicModule, Module, Global } from "@nestjs/common";
import {
  RedisModule as IORedisModule,
  RedisModuleOptions,
} from "@nestjs-modules/ioredis";
import { TokenRevocationService } from "./services/token-revocation.service";
import { NotificationPubSubService } from "./services/notification-pubsub.service";

export interface RedisModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions;
  inject?: any[];
}

@Global()
@Module({})
export class RedisModule {
  /**
   * Configure Redis module with async options
   */
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: [
        IORedisModule.forRootAsync({
          useFactory: options.useFactory,
          inject: options.inject || [],
        }),
      ],
      providers: [TokenRevocationService, NotificationPubSubService],
      exports: [
        IORedisModule,
        TokenRevocationService,
        NotificationPubSubService,
      ],
    };
  }
}
