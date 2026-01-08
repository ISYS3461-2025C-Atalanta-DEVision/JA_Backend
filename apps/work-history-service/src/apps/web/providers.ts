import { Provider } from "@nestjs/common";
import { WORK_HISTORY_SERVICE_WEB_PROVIDER } from "./constants";
import { WorkHistoryService } from "./services";
import { IWorkHistoryService } from "./interfaces";

export const WorkHistoryServiceWebProvider: Provider<IWorkHistoryService> = {
  provide: WORK_HISTORY_SERVICE_WEB_PROVIDER,
  useClass: WorkHistoryService,
};
