import { Module } from '@nestjs/common';
import { AdminAuthController } from './controllers';
import { MongodbModule } from 'apps/admin-service/src/libs';
import { AdminAuthServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthServiceWebProvider],
  exports: [AdminAuthServiceWebProvider],
})
export class AuthModule {}
