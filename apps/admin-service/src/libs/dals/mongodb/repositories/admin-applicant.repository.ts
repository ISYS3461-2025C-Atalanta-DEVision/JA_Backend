import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongoRepository } from "./base.repository";
import { AdminApplicant } from "../schemas";
import { IAdminApplicantRepository } from "../interfaces";

@Injectable()
export class AdminApplicantRepository
  extends BaseMongoRepository<AdminApplicant>
  implements IAdminApplicantRepository
{
  constructor(
    @InjectModel(AdminApplicant.name)
    model: Model<AdminApplicant>,
  ) {
    super(model);
  }

  /**
   * Find adminApplicant by name
   */
  async findByName(name: string): Promise<AdminApplicant | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as AdminApplicant | null;
  }

  /**
   * Find adminApplicant by email
   */
  async findByEmail(email: string): Promise<AdminApplicant | null> {
    return (await this.model
      .findOne({ email: email.toLowerCase() })
      .lean()
      .exec()) as AdminApplicant | null;
  }

  /**
   * Increment login attempts for brute force protection
   */
  async incrementLoginAttempts(id: string): Promise<void> {
    await this.model
      .updateOne({ _id: id }, { $inc: { loginAttempts: 1 } })
      .exec();
  }

  /**
   * Lock account until specified time
   */
  async lockAccount(id: string, lockUntil: Date): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { lockUntil } }).exec();
  }

  /**
   * Reset login attempts after successful login
   */
  async resetLoginAttempts(id: string): Promise<void> {
    await this.model
      .updateOne({ _id: id }, { $set: { loginAttempts: 0, lockUntil: null } })
      .exec();
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.model
      .updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } })
      .exec();
  }
}
