import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EducationDocument = HydratedDocument<Education>;

export enum EducationLevel {
  HighSchool = 'HighSchool',
  Bachelor = 'Bachelor',
  Master = 'Master',
  PhD = 'PhD',
  NoGiven = 'NoGiven',
}

/**
 * Education Schema
 * Stores education data
 */
@Schema({
  collection: 'educations',
  timestamps: true,
})
export class Education {
  @Prop({ type: Types.ObjectId, required: true })
  applicantId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(EducationLevel),
    required: true,
  })
  levelStudy: EducationLevel;

  @Prop({ type: String, required: true })
  major: string;

  @Prop({ type: String })
  schoolName?: string;

  @Prop({ type: Number })
  gpa?: number;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: [Types.ObjectId], default: [] })
  skillCategories: Types.ObjectId[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EducationSchema = SchemaFactory.createForClass(Education);

// Indexes for performance
EducationSchema.index({ name: 1 });
EducationSchema.index({ isActive: 1 });
EducationSchema.index({ createdAt: -1 });

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.educations", { _id: "hashed" })
 */
