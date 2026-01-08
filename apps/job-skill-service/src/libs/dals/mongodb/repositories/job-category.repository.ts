import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongoRepository } from "./base.repository";
import { JobCategory } from "../schemas";
import { IJobCategoryRepository } from "../interfaces";

@Injectable()
export class JobCategoryRepository
  extends BaseMongoRepository<JobCategory>
  implements IJobCategoryRepository
{
  constructor(
    @InjectModel(JobCategory.name)
    model: Model<JobCategory>,
  ) {
    super(model);
  }

  /**
   * Find jobCategory by name
   * @param name - Name to search for
   * @returns JobCategory or null
   */
  async findByName(name: string): Promise<JobCategory | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as JobCategory | null;
  }

  // Add custom repository methods here
}
