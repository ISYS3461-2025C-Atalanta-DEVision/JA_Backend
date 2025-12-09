---
to: apps/<%= kebabName %>/src/libs/dals/mongodb/constants.ts
---
export const MONGODB_PROVIDER = Symbol('MongoDBProvider');
export const <%= entityUpperSnake %>_REPO_PROVIDER = Symbol('<%= entityPascal %>RepositoryProvider');
