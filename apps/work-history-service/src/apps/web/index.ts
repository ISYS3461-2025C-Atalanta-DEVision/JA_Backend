export * from "./apis";
export * from "./interfaces";
export * from "./services";
export * from "./constants";
export * from "./providers";

import { WorkHistoryModule } from "./apis/work-history";

export const modules = [WorkHistoryModule];
