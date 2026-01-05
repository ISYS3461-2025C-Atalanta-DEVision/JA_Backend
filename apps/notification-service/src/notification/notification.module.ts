import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MongodbModule } from '../libs';

@Module({
  imports: [MongodbModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
