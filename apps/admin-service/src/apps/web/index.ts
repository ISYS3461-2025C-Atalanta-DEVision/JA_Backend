export * from "./apis";
export * from "./interfaces";
export * from "./services";
export * from "./constants";
export * from "./providers";

import { AdminApplicantModule } from "./apis/admin-applicant";
import { AuthModule } from "./apis/auth";

export const modules = [AdminApplicantModule, AuthModule];
