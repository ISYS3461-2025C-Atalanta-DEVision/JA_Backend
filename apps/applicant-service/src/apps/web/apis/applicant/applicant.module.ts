import { Module } from '@nestjs/common';
import { ApplicantController } from './controllers';
import { MongodbModule } from 'apps/applicant-service/src/libs';
import { ApplicantServiceWebProvider } from '../../providers';
import { MailerModule } from '@libs/mailer';

@Module({
  imports: [MongodbModule, MailerModule],
  controllers: [ApplicantController],
  providers: [ApplicantServiceWebProvider],
  exports: [ApplicantServiceWebProvider],
})
export class ApplicantModule { }
