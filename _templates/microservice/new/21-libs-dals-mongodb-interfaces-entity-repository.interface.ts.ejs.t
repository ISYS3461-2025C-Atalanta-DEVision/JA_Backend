---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/interfaces/<%= entityKebab %>-repository.interface.ts
---
import { IBaseMongoRepository } from './base-repository.interface';
import { <%= entityPascal %> } from '../schemas';

export interface I<%= entityPascal %>Repository extends IBaseMongoRepository<<%= entityPascal %>> {
  findByName(name: string): Promise<<%= entityPascal %> | null>;
  // Add custom method signatures here
}
