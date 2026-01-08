import { IBaseMongoRepository } from "./base-repository.interface";
import { Skill } from "../schemas";

export interface ISkillRepository extends IBaseMongoRepository<Skill> {
  findByName(name: string): Promise<Skill | null>;
  findByJobCategoryId(categoryId: string): Promise<Skill[]>;
  softDeleteByJobCategoryId(categoryId: string): Promise<number>;
  hardDeleteByJobCategoryId(categoryId: string): Promise<number>;
}
