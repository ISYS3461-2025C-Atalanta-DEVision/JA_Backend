import { Module } from '@nestjs/common';
import { WorkHistoryController } from './controllers';
import { MongodbModule } from 'apps/work-history-service/src/libs';
import { WorkHistoryServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [WorkHistoryController],
  providers: [WorkHistoryServiceWebProvider],
  exports: [WorkHistoryServiceWebProvider],
})
export class WorkHistoryModule {}
