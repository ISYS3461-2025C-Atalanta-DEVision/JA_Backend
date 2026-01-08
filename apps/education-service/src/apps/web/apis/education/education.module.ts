import { Module } from "@nestjs/common";
import { EducationController } from "./controllers";
import { MongodbModule } from "apps/education-service/src/libs";
import { EducationServiceWebProvider } from "../../providers";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    MongodbModule,
    ClientsModule.registerAsync([
      {
        name: "APPLICANT_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("app_config.applicantServiceHost"),
            port: configService.get<number>("app_config.applicantServicePort"),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EducationController],
  providers: [EducationServiceWebProvider],
  exports: [EducationServiceWebProvider],
})
export class EducationModule {}
