import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JobApplicationController } from "./controllers";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "JOB_APPLICATION_SERVICE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>("JOB_APPLICATION_SERVICE_HOST") ||
              "localhost",
            port: configService.get<number>("JOB_APPLICATION_SERVICE_PORT") || 3007,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [JobApplicationController],
})
export class JobApplicationModule { }
