import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { Applicant } from '../schemas';
import { IApplicantRepository } from '../interfaces';

@Injectable()
export class ApplicantRepository
  extends BaseMongoRepository<Applicant>
  implements IApplicantRepository {
  constructor(
    @InjectModel(Applicant.name)
    model: Model<Applicant>,
  ) {
    super(model);
  }

  async findByEmail(email: string): Promise<Applicant | null> {
    return (await this.model
      .findOne({ email: email.toLowerCase() })
      .lean()
      .exec()) as Applicant | null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, {
        $inc: { loginAttempts: 1 },
      })
      .exec();
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, {
        $set: { loginAttempts: 0, lockUntil: null },
      })
      .exec();
  }

  async lockAccount(id: string, lockUntil: Date): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, {
        $set: { lockUntil },
      })
      .exec();
  }
}
