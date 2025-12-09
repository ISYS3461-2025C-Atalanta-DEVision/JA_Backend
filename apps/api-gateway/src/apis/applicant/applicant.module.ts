import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApplicantController } from './controllers';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'APPLICANT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('APPLICANT_SERVICE_HOST') || 'localhost',
            port: configService.get<number>('APPLICANT_SERVICE_PORT') || 3002,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ApplicantController],
})
export class ApplicantModule {}
