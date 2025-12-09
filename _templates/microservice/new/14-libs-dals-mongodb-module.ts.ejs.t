---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/mongodb.module.ts
---
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { <%= entityPascal %>, <%= entityPascal %>Schema } from './schemas';
import { <%= entityPascal %>RepositoryProvider } from './providers';
import { <%= entityPascal %>Repository } from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: <%= entityPascal %>.name, schema: <%= entityPascal %>Schema },
    ]),
  ],
  providers: [
    <%= entityPascal %>Repository,
    <%= entityPascal %>RepositoryProvider,
  ],
  exports: [
    MongooseModule,
    <%= entityPascal %>Repository,
    <%= entityPascal %>RepositoryProvider,
  ],
})
export class MongodbModule {}
