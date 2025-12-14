import { Module } from '@nestjs/common';
import { SkillController } from './controllers';
import { MongodbModule } from 'apps/job-skill-service/src/libs';
import { SkillServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [SkillController],
  providers: [SkillServiceWebProvider],
  exports: [SkillServiceWebProvider],
})
export class SkillModule {}
