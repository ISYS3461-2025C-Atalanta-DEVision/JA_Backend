import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SkillDocument = HydratedDocument<Skill>;

/**
 * Skill Schema
 * Stores skill data linked to JobCategory
 */
@Schema({
  collection: 'skills',
  timestamps: true,
})
export class Skill {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  jobCategoryId: string;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  createdBy?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);

// Indexes for performance
SkillSchema.index({ name: 1 }, { unique: true });
SkillSchema.index({ jobCategoryId: 1 });
SkillSchema.index({ isActive: 1 });
SkillSchema.index({ createdAt: -1 });
SkillSchema.index({ jobCategoryId: 1, isActive: 1 });
