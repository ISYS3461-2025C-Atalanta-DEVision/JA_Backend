import { Module } from '@nestjs/common';
import { JobCategoryController } from './controllers';
import { MongodbModule } from 'apps/job-skill-service/src/libs';
import { JobCategoryServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [JobCategoryController],
  providers: [JobCategoryServiceWebProvider],
  exports: [JobCategoryServiceWebProvider],
})
export class JobCategoryModule {}
