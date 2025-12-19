import { Module } from '@nestjs/common';
import { StorageController } from './controllers';

@Module({
  controllers: [StorageController],
})
export class StorageApiModule {}
