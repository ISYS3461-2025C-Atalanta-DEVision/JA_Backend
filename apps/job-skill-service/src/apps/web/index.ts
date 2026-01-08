export * from "./apis";
export * from "./interfaces";
export * from "./services";
export * from "./constants";
export * from "./providers";

import { JobCategoryModule } from "./apis/job-category";
import { SkillModule } from "./apis/skill";

export const modules = [JobCategoryModule, SkillModule];
