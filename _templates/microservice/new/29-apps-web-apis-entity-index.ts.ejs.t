---
to: apps/<%= kebabName %>/src/apps/web/apis/<%= entityKebab %>/index.ts
---
export * from './<%= entityKebab %>.module';
export * from './controllers';
export * from './dtos';
