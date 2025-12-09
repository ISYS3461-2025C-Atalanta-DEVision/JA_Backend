---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/interfaces/index.ts
---
export * from './base-repository.interface';
export * from './<%= entityKebab %>-repository.interface';
