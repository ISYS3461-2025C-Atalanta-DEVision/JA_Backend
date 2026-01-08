import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Education, EducationSchema } from "./schemas";
import { EducationRepositoryProvider } from "./providers";
import { EducationRepository } from "./repositories";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Education.name, schema: EducationSchema },
    ]),
  ],
  providers: [EducationRepository, EducationRepositoryProvider],
  exports: [MongooseModule, EducationRepository, EducationRepositoryProvider],
})
export class MongodbModule {}
