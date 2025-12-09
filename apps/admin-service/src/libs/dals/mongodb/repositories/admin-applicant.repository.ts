import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { AdminApplicant } from '../schemas';
import { IAdminApplicantRepository } from '../interfaces';

@Injectable()
export class AdminApplicantRepository
  extends BaseMongoRepository<AdminApplicant>
  implements IAdminApplicantRepository {
  constructor(
    @InjectModel(AdminApplicant.name)
    model: Model<AdminApplicant>,
  ) {
    super(model);
  }

  /**
   * Find adminApplicant by name
   * @param name - Name to search for
   * @returns AdminApplicant or null
   */
  async findByName(name: string): Promise<AdminApplicant | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as AdminApplicant | null;
  }

  // Add custom repository methods here
}
