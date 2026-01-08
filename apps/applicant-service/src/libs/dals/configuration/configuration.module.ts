import { join } from "path";
import { EnvUtil } from "@libs/common/utils/environment.util";
import { Global, Module, Provider } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configs } from "apps/applicant-service/src/configs";
import { AppConfigServiceProvider } from "./providers";

// App root: apps/applicant-service/ (relative to project root)
const APP_ROOT = join(process.cwd(), "apps/applicant-service");

const providers: Provider[] = [AppConfigServiceProvider];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: EnvUtil.isProduction(),
      expandVariables: true,
      load: configs,
      envFilePath: EnvUtil.getPathEnv(APP_ROOT),
    }),
  ],
  providers,
  exports: providers,
})
export class ConfigurationModule {}
