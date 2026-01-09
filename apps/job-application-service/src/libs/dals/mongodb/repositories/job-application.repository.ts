import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { JobApplication } from '../schemas';
import { IJobApplicationRepository } from '../interfaces';

@Injectable()
export class JobApplicationRepository
  extends BaseMongoRepository<JobApplication>
  implements IJobApplicationRepository {
  constructor(
    @InjectModel(JobApplication.name)
    model: Model<JobApplication>,
  ) {
    super(model);
  }

  /**
   * Find jobApplication by name
   * @param name - Name to search for
   * @returns JobApplication or null
   */
  async findByName(name: string): Promise<JobApplication | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as JobApplication | null;
  }

  // Add custom repository methods here
}
