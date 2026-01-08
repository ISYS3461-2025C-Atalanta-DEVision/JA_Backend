import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WorkHistoryController } from "./controllers";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "WORK_HISTORY_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>("WORK_HISTORY_SERVICE_HOST") ||
              "localhost",
            port:
              configService.get<number>("WORK_HISTORY_SERVICE_PORT") || 3006,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [WorkHistoryController],
})
export class WorkHistoryModule {}
