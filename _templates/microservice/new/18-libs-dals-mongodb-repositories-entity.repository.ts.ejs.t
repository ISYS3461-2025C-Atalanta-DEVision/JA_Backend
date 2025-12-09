---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/repositories/<%= entityKebab %>.repository.ts
---
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { <%= entityPascal %> } from '../schemas';
import { I<%= entityPascal %>Repository } from '../interfaces';

@Injectable()
export class <%= entityPascal %>Repository
  extends BaseMongoRepository<<%= entityPascal %>>
  implements I<%= entityPascal %>Repository {
  constructor(
    @InjectModel(<%= entityPascal %>.name)
    model: Model<<%= entityPascal %>>,
  ) {
    super(model);
  }

  /**
   * Find <%= entityCamel %> by name
   * @param name - Name to search for
   * @returns <%= entityPascal %> or null
   */
  async findByName(name: string): Promise<<%= entityPascal %> | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as <%= entityPascal %> | null;
  }

  // Add custom repository methods here
}
