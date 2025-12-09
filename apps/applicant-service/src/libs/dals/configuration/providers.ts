import { Provider } from "@nestjs/common";
import { IAppConfigService } from "./interfaces";
import { APP_CONFIG_SERVICE_PROVIDER } from "./constants";
import { AppConfigService } from "./services";

export const AppConfigServiceProvider: Provider<IAppConfigService> = {
  provide: APP_CONFIG_SERVICE_PROVIDER,
  useClass: AppConfigService,
};