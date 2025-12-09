import { Module } from '@nestjs/common';
import { ApplicantAuthController } from './controllers';
import { ApplicantAuthServiceWebProvider } from '../../providers';
import { MongodbModule } from '../../../../libs/dals/mongodb';

@Module({
  imports: [MongodbModule],
  controllers: [ApplicantAuthController],
  providers: [ApplicantAuthServiceWebProvider],
  exports: [ApplicantAuthServiceWebProvider],
})
export class ApplicantAuthModule { }
