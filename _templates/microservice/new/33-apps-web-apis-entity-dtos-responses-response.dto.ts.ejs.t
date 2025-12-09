---
to: apps/<%= kebabName %>/src/apps/web/apis/<%= entityKebab %>/dtos/responses/<%= entityKebab %>-response.dto.ts
---
export class <%= entityPascal %>ResponseDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
