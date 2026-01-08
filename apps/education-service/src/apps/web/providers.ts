import { Provider } from "@nestjs/common";
import { EDUCATION_SERVICE_WEB_PROVIDER } from "./constants";
import { EducationService } from "./services";
import { IEducationService } from "./interfaces";

export const EducationServiceWebProvider: Provider<IEducationService> = {
  provide: EDUCATION_SERVICE_WEB_PROVIDER,
  useClass: EducationService,
};
