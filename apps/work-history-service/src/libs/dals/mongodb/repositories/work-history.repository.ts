import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongoRepository } from "./base.repository";
import { WorkHistory } from "../schemas";
import { IWorkHistoryRepository } from "../interfaces";

@Injectable()
export class WorkHistoryRepository
  extends BaseMongoRepository<WorkHistory>
  implements IWorkHistoryRepository
{
  constructor(
    @InjectModel(WorkHistory.name)
    model: Model<WorkHistory>,
  ) {
    super(model);
  }

  /**
   * Find workHistory by name
   * @param name - Name to search for
   * @returns WorkHistory or null
   */
  async findByName(name: string): Promise<WorkHistory | null> {
    return (await this.model
      .findOne({ name: name })
      .lean()
      .exec()) as WorkHistory | null;
  }

  // Add custom repository methods here
}
