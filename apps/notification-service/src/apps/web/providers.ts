import { Provider } from '@nestjs/common';
import { NOTIFICATION_SERVICE_WEB_PROVIDER } from './constants';
import { NotificationService } from './services';
import { INotificationService } from './interfaces';

export const NotificationServiceWebProvider: Provider<INotificationService> = {
  provide: NOTIFICATION_SERVICE_WEB_PROVIDER,
  useClass: NotificationService,
};
