---
to: apps/<%= kebabName %>/src/apps/web/apis/<%= entityKebab %>/dtos/requests/create-<%= entityKebab %>.dto.ts
---
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Create<%= entityPascal %>Dto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
