import { Provider } from "@nestjs/common";
import {
  JOB_CATEGORY_SERVICE_WEB_PROVIDER,
  SKILL_SERVICE_WEB_PROVIDER,
} from "./constants";
import { JobCategoryService, SkillService } from "./services";
import { IJobCategoryService, ISkillService } from "./interfaces";

export const JobCategoryServiceWebProvider: Provider<IJobCategoryService> = {
  provide: JOB_CATEGORY_SERVICE_WEB_PROVIDER,
  useClass: JobCategoryService,
};

export const SkillServiceWebProvider: Provider<ISkillService> = {
  provide: SKILL_SERVICE_WEB_PROVIDER,
  useClass: SkillService,
};
