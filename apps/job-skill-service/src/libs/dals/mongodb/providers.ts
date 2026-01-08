import { Provider } from "@nestjs/common";
import { JOB_CATEGORY_REPO_PROVIDER, SKILL_REPO_PROVIDER } from "./constants";
import { IJobCategoryRepository, ISkillRepository } from "./interfaces";
import { JobCategoryRepository, SkillRepository } from "./repositories";

export const JobCategoryRepositoryProvider: Provider<IJobCategoryRepository> = {
  provide: JOB_CATEGORY_REPO_PROVIDER,
  useClass: JobCategoryRepository,
};

export const SkillRepositoryProvider: Provider<ISkillRepository> = {
  provide: SKILL_REPO_PROVIDER,
  useClass: SkillRepository,
};
