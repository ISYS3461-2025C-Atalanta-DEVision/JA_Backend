import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApplicantDocument = HydratedDocument<Applicant>;

/**
 * Applicant Schema
 * Stores applicant profile and email/password authentication info
 * Token storage is handled by OAuthAccount
 */
@Schema({
  collection: 'applicants',
  timestamps: true,
})
export class Applicant {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  addressProvinceCode?: string;

  @Prop()
  addressProvinceName?: string;

  /**
   * Password hash for email/password authentication
   * Null if user only uses OAuth (Google)
   */
  @Prop()
  passwordHash?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);
