import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NotificationController } from "./controllers";
import { MongodbModule } from "../../../../libs";
import { NotificationServiceWebProvider } from "../../providers";
import { MailerModule } from "@libs/mailer";
import { RedisModule } from "@redis/redis.module";

@Module({
  imports: [
    MongodbModule,
    MailerModule,
    RedisModule,
    // APPLICANT_SERVICE client for validation
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
      {
        name: "JOB_SKILL_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("app_config.jobSkillServiceHost"),
            port: configService.get<number>("app_config.jobSkillServicePort"),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationServiceWebProvider],
  exports: [NotificationServiceWebProvider],
})
export class NotificationModule {}
