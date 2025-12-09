---
to: apps/<%= kebabName %>/src/apps/web/apis/<%= entityKebab %>/dtos/requests/update-<%= entityKebab %>.dto.ts
---
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class Update<%= entityPascal %>Dto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
