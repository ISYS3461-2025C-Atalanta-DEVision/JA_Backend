import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EducationController } from './controllers';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EDUCATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('EDUCATION_SERVICE_HOST') || 'localhost',
            port: configService.get<number>('EDUCATION_SERVICE_PORT') || 3007,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EducationController],
})
export class EducationModule { }
