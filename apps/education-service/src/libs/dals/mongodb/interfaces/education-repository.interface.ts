import { IBaseMongoRepository } from "./base-repository.interface";
import { Education } from "../schemas";

export interface IEducationRepository extends IBaseMongoRepository<Education> {
  findByName(name: string): Promise<Education | null>;
  // Add custom method signatures here
}
