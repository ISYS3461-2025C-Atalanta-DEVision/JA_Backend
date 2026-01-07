import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkHistoryDocument = HydratedDocument<WorkHistory>;

/**
 * WorkHistory Schema
 * Stores workHistory data
 */
@Schema({
  collection: 'work-histories',
  timestamps: true,
})
export class WorkHistory {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  applicantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Types.ObjectId, required: true })
  companyId: Types.ObjectId;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: [Types.ObjectId], default: [] })
  skillCategories: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const WorkHistorySchema = SchemaFactory.createForClass(WorkHistory);

// Indexes for performance
WorkHistorySchema.index({ name: 1 });
WorkHistorySchema.index({ isActive: 1 });
WorkHistorySchema.index({ createdAt: -1 });

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.work-histories", { _id: "hashed" })
 */
