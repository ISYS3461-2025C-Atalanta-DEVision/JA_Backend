import { Module } from '@nestjs/common';
import { AdminApplicantController } from './controllers';
import { MongodbModule } from 'apps/admin-service/src/libs';
import { AdminApplicantServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [AdminApplicantController],
  providers: [AdminApplicantServiceWebProvider],
  exports: [AdminApplicantServiceWebProvider],
})
export class AdminApplicantModule {}
