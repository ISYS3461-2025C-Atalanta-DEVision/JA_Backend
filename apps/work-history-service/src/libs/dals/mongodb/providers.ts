import { Provider } from "@nestjs/common";
import { WORK_HISTORY_REPO_PROVIDER } from "./constants";
import { IWorkHistoryRepository } from "./interfaces";
import { WorkHistoryRepository } from "./repositories";

export const WorkHistoryRepositoryProvider: Provider<IWorkHistoryRepository> = {
  provide: WORK_HISTORY_REPO_PROVIDER,
  useClass: WorkHistoryRepository,
};
