---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/repositories/index.ts
---
export * from './base.repository';
export * from './<%= entityKebab %>.repository';
