---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/schemas/<%= entityKebab %>.schema.ts
---
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type <%= entityPascal %>Document = HydratedDocument<<%= entityPascal %>>;

/**
 * <%= entityPascal %> Schema
 * Stores <%= entityCamel %> data
 */
@Schema({
  collection: '<%= entityPlural %>',
  timestamps: true,
})
export class <%= entityPascal %> {
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

export const <%= entityPascal %>Schema = SchemaFactory.createForClass(<%= entityPascal %>);

// Indexes for performance
<%= entityPascal %>Schema.index({ name: 1 });
<%= entityPascal %>Schema.index({ isActive: 1 });
<%= entityPascal %>Schema.index({ createdAt: -1 });

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.<%= entityPlural %>", { _id: "hashed" })
 */
