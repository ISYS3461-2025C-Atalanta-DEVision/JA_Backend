---
to: apps/<%= kebabName %>/src/apps/web/apis/<%= entityKebab %>/<%= entityKebab %>.module.ts
---
import { Module } from '@nestjs/common';
import { <%= entityPascal %>Controller } from './controllers';
import { MongodbModule } from 'apps/<%= kebabName %>/src/libs';
import { <%= entityPascal %>ServiceWebProvider } from '../../providers';

@Module({
  imports: [MongodbModule],
  controllers: [<%= entityPascal %>Controller],
  providers: [<%= entityPascal %>ServiceWebProvider],
  exports: [<%= entityPascal %>ServiceWebProvider],
})
export class <%= entityPascal %>Module {}
