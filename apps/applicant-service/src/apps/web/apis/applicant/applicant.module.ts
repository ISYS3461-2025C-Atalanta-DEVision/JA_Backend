import { Module } from '@nestjs/common';
import { ApplicantController } from './controllers';
import { MongodbModule } from 'apps/applicant-service/src/libs';
import { ApplicantServiceWebProvider, SearchProfileServiceProvider } from '../../providers';
import { MailerModule } from '@libs/mailer';
import { KafkaModule } from '@kafka/kafka.module';

@Module({
  imports: [MongodbModule, MailerModule, KafkaModule],
  controllers: [ApplicantController],
  providers: [ApplicantServiceWebProvider, SearchProfileServiceProvider],
  exports: [ApplicantServiceWebProvider, SearchProfileServiceProvider],
})
export class ApplicantModule { }
