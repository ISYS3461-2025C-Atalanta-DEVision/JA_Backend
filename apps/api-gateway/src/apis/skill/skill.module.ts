import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SkillController } from "./controllers";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "JOB_SKILL_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>("JOB_SKILL_SERVICE_HOST") ||
              "localhost",
            port: configService.get<number>("JOB_SKILL_SERVICE_PORT") || 3004,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [SkillController],
})
export class SkillModule {}
