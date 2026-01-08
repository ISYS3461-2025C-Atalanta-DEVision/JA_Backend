import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WorkHistory, WorkHistorySchema } from "./schemas";
import { WorkHistoryRepositoryProvider } from "./providers";
import { WorkHistoryRepository } from "./repositories";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkHistory.name, schema: WorkHistorySchema },
    ]),
  ],
  providers: [WorkHistoryRepository, WorkHistoryRepositoryProvider],
  exports: [
    MongooseModule,
    WorkHistoryRepository,
    WorkHistoryRepositoryProvider,
  ],
})
export class MongodbModule {}
