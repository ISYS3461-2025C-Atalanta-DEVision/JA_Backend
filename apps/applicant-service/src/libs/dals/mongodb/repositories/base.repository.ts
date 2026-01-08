import { Model, FilterQuery, QueryOptions, Types } from "mongoose";
import { IBaseMongoRepository } from "../interfaces/base-repository.interface";

export abstract class BaseMongoRepository<T>
  implements IBaseMongoRepository<T>
{
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return (await this.model.findById(id).lean().exec()) as T | null;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return (await this.model.findOne(filter).lean().exec()) as T | null;
  }

  async findMany(
    filter: FilterQuery<T> = {},
    options: QueryOptions<T> = {},
  ): Promise<T[]> {
    return (await this.model.find(filter, null, options).lean().exec()) as T[];
  }

  async findManyAndCount(
    filter: FilterQuery<T> = {},
    options: QueryOptions<T> = {},
  ): Promise<[T[], number]> {
    const [docs, count] = await Promise.all([
      this.model.find(filter, null, options).lean().exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return [docs as T[], count];
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const created = await this.model.create(data);
    return created.toObject() as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const created = await this.model.insertMany(data);
    return created.map((doc) => (doc as any).toObject()) as T[];
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return (await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec()) as T | null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
