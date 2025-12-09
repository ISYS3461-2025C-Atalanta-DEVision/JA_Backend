---
to: apps/<%= kebabName %>/src/apps/index.ts
---
import { modules as webModules } from './web';

export const modules = [...webModules];
