import { FilterQuery, QueryOptions } from "mongoose";

export interface IBaseMongoRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findMany(filter?: FilterQuery<T>, options?: QueryOptions<T>): Promise<T[]>;
  findManyAndCount(
    filter?: FilterQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<[T[], number]>;
  count(filter?: FilterQuery<T>): Promise<number>;
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
