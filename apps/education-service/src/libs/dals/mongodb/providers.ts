import { Provider } from "@nestjs/common";
import { EDUCATION_REPO_PROVIDER } from "./constants";
import { IEducationRepository } from "./interfaces";
import { EducationRepository } from "./repositories";

export const EducationRepositoryProvider: Provider<IEducationRepository> = {
  provide: EDUCATION_REPO_PROVIDER,
  useClass: EducationRepository,
};
