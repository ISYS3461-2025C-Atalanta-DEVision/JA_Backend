import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminApplicantDocument = HydratedDocument<AdminApplicant>;

/**
 * AdminApplicant Schema
 * Stores adminApplicant data
 */
@Schema({
  collection: 'admin-applicants',
  timestamps: true,
})
export class AdminApplicant {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AdminApplicantSchema = SchemaFactory.createForClass(AdminApplicant);

// Indexes for performance
AdminApplicantSchema.index({ name: 1 });
AdminApplicantSchema.index({ isActive: 1 });
AdminApplicantSchema.index({ createdAt: -1 });

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.admin-applicants", { _id: "hashed" })
 */
