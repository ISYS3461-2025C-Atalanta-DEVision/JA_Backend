import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JobApplicationDocument = HydratedDocument<JobApplication>;

export enum JobApplicationStatus {
  Pending = 'PENDING',
  Archived = 'ARCHIVED',
}

/**
 * JobApplication Schema
 * Stores jobApplication data
 */
@Schema({
  collection: 'job-applications',
  timestamps: true,
})
export class JobApplication {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  applicantId: string;

  @Prop({ type: String, required: true })
  jobId: string;

  @Prop({ default: [] })
  mediaUrls?: string[];

  @Prop({ type: Date, required: true })
  appliedAt: Date;

  @Prop({
    type: String,
    enum: Object.values(JobApplicationStatus),
    required: true,
    default: JobApplicationStatus.Pending,
  })
  status: JobApplicationStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const JobApplicationSchema = SchemaFactory.createForClass(JobApplication);

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.job-applications", { _id: "hashed" })
 */
