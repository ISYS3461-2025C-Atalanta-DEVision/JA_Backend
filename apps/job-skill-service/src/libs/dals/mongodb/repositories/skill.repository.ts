import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { Skill } from '../schemas';
import { ISkillRepository } from '../interfaces';

@Injectable()
export class SkillRepository
  extends BaseMongoRepository<Skill>
  implements ISkillRepository {
  constructor(
    @InjectModel(Skill.name)
    model: Model<Skill>,
  ) {
    super(model);
  }

  /**
   * Find skill by name
   * @param name - Name to search for
   * @returns Skill or null
   */
  async findByName(name: string): Promise<Skill | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as Skill | null;
  }

  /**
   * Find all skills by job category ID
   * @param categoryId - Job category ID
   * @returns Array of skills
   */
  async findByJobCategoryId(categoryId: string): Promise<Skill[]> {
    return (await this.model
      .find({ jobCategoryId: categoryId, isActive: true })
      .lean()
      .exec()) as Skill[];
  }

  /**
   * Soft delete all skills by job category ID (cascade)
   * @param categoryId - Job category ID
   * @returns Number of modified documents
   */
  async softDeleteByJobCategoryId(categoryId: string): Promise<number> {
    const result = await this.model.updateMany(
      { jobCategoryId: categoryId },
      { $set: { isActive: false } },
    );
    return result.modifiedCount;
  }

  /**
   * Hard delete all skills by job category ID (cascade)
   * @param categoryId - Job category ID
   * @returns Number of deleted documents
   */
  async hardDeleteByJobCategoryId(categoryId: string): Promise<number> {
    const result = await this.model.deleteMany({ jobCategoryId: categoryId });
    return result.deletedCount;
  }
}
