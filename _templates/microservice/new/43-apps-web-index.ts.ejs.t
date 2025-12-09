---
to: apps/<%= kebabName %>/src/apps/web/index.ts
---
export * from './apis';
export * from './interfaces';
export * from './services';
export * from './constants';
export * from './providers';

import { <%= entityPascal %>Module } from './apis/<%= entityKebab %>';

export const modules = [<%= entityPascal %>Module];
