---
to: apps/<%= kebabName %>/src/apps/web/interfaces/<%= entityKebab %>-service.interface.ts
---
import { <%= entityPascal %>ResponseDto } from '../apis/<%= entityKebab %>/dtos';
import { Create<%= entityPascal %>Dto, Update<%= entityPascal %>Dto } from '../apis/<%= entityKebab %>/dtos';

export interface I<%= entityPascal %>Service {
  create(createDto: Create<%= entityPascal %>Dto): Promise<<%= entityPascal %>ResponseDto>;
  findById(id: string): Promise<<%= entityPascal %>ResponseDto>;
  findAll(page: number, limit: number): Promise<{
    data: <%= entityPascal %>ResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, updateDto: Update<%= entityPascal %>Dto): Promise<<%= entityPascal %>ResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
}
