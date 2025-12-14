import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JobCategoryDocument = HydratedDocument<JobCategory>;

/**
 * JobCategory Schema
 * Stores jobCategory data
 */
@Schema({
  collection: 'job-categories',
  timestamps: true,
})
export class JobCategory {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  slug?: string;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const JobCategorySchema = SchemaFactory.createForClass(JobCategory);

// Indexes for performance
JobCategorySchema.index({ name: 1 });
JobCategorySchema.index({ slug: 1 }, { unique: true, sparse: true });
JobCategorySchema.index({ isActive: 1 });
JobCategorySchema.index({ createdAt: -1 });

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.job-categories", { _id: "hashed" })
 */
