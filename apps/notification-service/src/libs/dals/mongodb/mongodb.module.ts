import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
  SearchProfileProjection,
  SearchProfileProjectionSchema,
} from './schemas';
import {
  NotificationRepository,
  SearchProfileProjectionRepository,
} from './repositories';
import {
  NOTIFICATION_REPO_PROVIDER,
  INotificationRepository,
  SEARCH_PROFILE_PROJECTION_REPO_PROVIDER,
  ISearchProfileProjectionRepository,
} from './interfaces';

const NotificationRepositoryProvider: Provider<INotificationRepository> = {
  provide: NOTIFICATION_REPO_PROVIDER,
  useClass: NotificationRepository,
};

const SearchProfileProjectionRepositoryProvider: Provider<ISearchProfileProjectionRepository> =
  {
    provide: SEARCH_PROFILE_PROJECTION_REPO_PROVIDER,
    useClass: SearchProfileProjectionRepository,
  };

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      {
        name: SearchProfileProjection.name,
        schema: SearchProfileProjectionSchema,
      },
    ]),
  ],
  providers: [
    NotificationRepository,
    NotificationRepositoryProvider,
    SearchProfileProjectionRepository,
    SearchProfileProjectionRepositoryProvider,
  ],
  exports: [
    MongooseModule,
    NotificationRepository,
    NotificationRepositoryProvider,
    SearchProfileProjectionRepository,
    SearchProfileProjectionRepositoryProvider,
  ],
})
export class MongodbModule {}
