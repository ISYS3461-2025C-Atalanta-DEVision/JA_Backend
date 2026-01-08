import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JobCategory, JobCategorySchema, Skill, SkillSchema } from "./schemas";
import {
  JobCategoryRepositoryProvider,
  SkillRepositoryProvider,
} from "./providers";
import { JobCategoryRepository, SkillRepository } from "./repositories";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobCategory.name, schema: JobCategorySchema },
      { name: Skill.name, schema: SkillSchema },
    ]),
  ],
  providers: [
    JobCategoryRepository,
    JobCategoryRepositoryProvider,
    SkillRepository,
    SkillRepositoryProvider,
  ],
  exports: [
    MongooseModule,
    JobCategoryRepository,
    JobCategoryRepositoryProvider,
    SkillRepository,
    SkillRepositoryProvider,
  ],
})
export class MongodbModule {}
