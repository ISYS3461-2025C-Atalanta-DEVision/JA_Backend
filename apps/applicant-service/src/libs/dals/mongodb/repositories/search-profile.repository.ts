import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongoRepository } from "./base.repository";
import { SearchProfile } from "../schemas";
import { ISearchProfileRepository } from "../interfaces";

@Injectable()
export class SearchProfileRepository
  extends BaseMongoRepository<SearchProfile>
  implements ISearchProfileRepository
{
  constructor(
    @InjectModel(SearchProfile.name)
    model: Model<SearchProfile>,
  ) {
    super(model);
  }

  async findByApplicantId(applicantId: string): Promise<SearchProfile | null> {
    return (await this.model
      .findOne({ applicantId })
      .lean()
      .exec()) as SearchProfile | null;
  }

  async findActiveProfiles(): Promise<SearchProfile[]> {
    return (await this.model
      .find({ isActive: true })
      .lean()
      .exec()) as SearchProfile[];
  }

  async findBySkillIds(skillIds: string[]): Promise<SearchProfile[]> {
    return (await this.model
      .find({
        isActive: true,
        skillIds: { $in: skillIds },
      })
      .lean()
      .exec()) as SearchProfile[];
  }

  async findByLocations(locations: string[]): Promise<SearchProfile[]> {
    return (await this.model
      .find({
        isActive: true,
        desiredLocations: { $in: locations },
      })
      .lean()
      .exec()) as SearchProfile[];
  }

  async upsertByApplicantId(
    applicantId: string,
    data: Partial<SearchProfile>,
  ): Promise<SearchProfile> {
    const result = await this.model
      .findOneAndUpdate(
        { applicantId },
        { $set: { ...data, applicantId } },
        { new: true, upsert: true },
      )
      .lean()
      .exec();
    return result as SearchProfile;
  }

  async deactivate(applicantId: string): Promise<boolean> {
    const result = await this.model
      .findOneAndUpdate({ applicantId }, { $set: { isActive: false } })
      .exec();
    return result !== null;
  }

  async activate(applicantId: string): Promise<boolean> {
    const result = await this.model
      .findOneAndUpdate({ applicantId }, { $set: { isActive: true } })
      .exec();
    return result !== null;
  }
}
