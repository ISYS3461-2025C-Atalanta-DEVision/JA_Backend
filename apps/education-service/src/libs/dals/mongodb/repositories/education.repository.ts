import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { Education } from '../schemas';
import { IEducationRepository } from '../interfaces';

@Injectable()
export class EducationRepository
  extends BaseMongoRepository<Education>
  implements IEducationRepository {
  constructor(
    @InjectModel(Education.name)
    model: Model<Education>,
  ) {
    super(model);
  }

  /**
   * Find education by name
   * @param name - Name to search for
   * @returns Education or null
   */
  async findByName(name: string): Promise<Education | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as Education | null;
  }

  // Add custom repository methods here
}
