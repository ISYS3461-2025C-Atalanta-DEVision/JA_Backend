---
to: apps/<%= kebabName %>/README.md
---
# <%= pascalName %> Service

<%= description %>

## Overview

This microservice is part of the Vietnam New Address Core system. It communicates via TCP with the API Gateway and other services.

## Configuration

### Environment Variables

```bash
# Service Configuration
<%= name.toUpperCase().replace(/-/g, '_') %>_HOST=localhost
<%= name.toUpperCase().replace(/-/g, '_') %>_PORT=<%= port %>
<% if (database === 'mongodb') { %>
# MongoDB Configuration
<%= name.toUpperCase().replace(/-/g, '_') %>_MONGODB_URI=mongodb://localhost:27017
<%= name.toUpperCase().replace(/-/g, '_') %>_MONGODB_DATABASE=<%= kebabName %>
<% } else if (database === 'postgres') { %>
# PostgreSQL Configuration
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_HOST=localhost
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_PORT=5432
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_USERNAME=postgres
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_PASSWORD=postgres
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_DATABASE=<%= kebabName %>
<% } %>
<% if (withAuth) { %>
# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d
<% } %>
```

## Development

### Build

```bash
npm run build:<%= kebabName %>
```

### Start

```bash
# Development mode with watch
npm run start:<%= kebabName %>:dev

# Production mode
npm run start:<%= kebabName %>
```

## Architecture

```
apps/<%= kebabName %>/
├── src/
│   ├── apis/              # Feature modules (generated with hygen)
│   │   └── [feature]/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── entities/
│   │       ├── dtos/
│   │       │   ├── requests/
│   │       │   └── responses/
│   │       └── [feature].module.ts
│   ├── <%= kebabName %>.module.ts  # Root module
│   └── main.ts            # Entry point
└── tsconfig.app.json      # TypeScript config
```

## Adding Features

Use Hygen generators to add new features:

```bash
# Add a new CRUD resource
npm run gen:crud

# Add a new entity
npm run gen:entity
```

## Communication

### TCP Message Patterns

This service listens for TCP messages on port <%= port %>. Message patterns should be defined in your controllers using the `@MessagePattern()` decorator.

Example:
```typescript
@MessagePattern('get_<%= camelName %>')
async get<%= pascalName %>(data: any) {
  // Implementation
}
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Generated Files

This service was generated using Hygen on <%= new Date().toISOString().split('T')[0] %>.

- Generator: `microservice/new`
- Command: `npm run gen:microservice`
