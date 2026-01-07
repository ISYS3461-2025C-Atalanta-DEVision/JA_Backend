import { Module } from '@nestjs/common';
import { EducationController } from './controllers';
import { MongodbModule } from 'apps/education-service/src/libs';
import { EducationServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [EducationController],
  providers: [EducationServiceWebProvider],
  exports: [EducationServiceWebProvider],
})
export class EducationModule {}
