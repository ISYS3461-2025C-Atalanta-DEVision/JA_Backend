import { Provider } from "@nestjs/common";
import { ADMIN_APPLICANT_REPO_PROVIDER } from "./constants";
import { IAdminApplicantRepository } from "./interfaces";
import { AdminApplicantRepository } from "./repositories";

export const AdminApplicantRepositoryProvider: Provider<IAdminApplicantRepository> =
  {
    provide: ADMIN_APPLICANT_REPO_PROVIDER,
    useClass: AdminApplicantRepository,
  };
