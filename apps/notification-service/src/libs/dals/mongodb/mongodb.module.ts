import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas';
import { NotificationRepository } from './repositories';
import { NOTIFICATION_REPO_PROVIDER, INotificationRepository } from './interfaces';
import { Provider } from '@nestjs/common';

const NotificationRepositoryProvider: Provider<INotificationRepository> = {
  provide: NOTIFICATION_REPO_PROVIDER,
  useClass: NotificationRepository,
};

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [NotificationRepository, NotificationRepositoryProvider],
  exports: [
    MongooseModule,
    NotificationRepository,
    NotificationRepositoryProvider,
  ],
})
export class MongodbModule {}
