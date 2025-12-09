---
to: apps/<%= kebabName %>/README.md
---
# <%= pascalName %>

<%= description %>

## Service Configuration

| Port Type | Port | Description |
|-----------|------|-------------|
| TCP | <%= port %> | Microservice communication |
| HTTP | <%= healthPort %> | Health check endpoint |

- **Database**: MongoDB (`<%= entityPlural %>` collection)
- **Entity**: <%= entityPascal %>

## Environment Variables

Create `.env.development` file in `apps/<%= kebabName %>/`:

```bash
DB_URL="mongodb://localhost:27017/<%= kebabName.replace(/-/g, '_') %>_dev"
```

## Running the Service

```bash
# Development
npm run start:<%= kebabName %>:dev

# Production
npm run build:<%= kebabName %>
npm run start:<%= kebabName %>
```

## Health Check

```bash
curl http://localhost:<%= healthPort %>/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "<%= kebabName %>",
  "timestamp": "2025-12-10T00:00:00.000Z",
  "uptime": 10
}
```

## TCP Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `<%= entityCamel %>.create` | Create new <%= entityCamel %> | `{ name, description? }` |
| `<%= entityCamel %>.findById` | Get <%= entityCamel %> by ID | `{ id }` |
| `<%= entityCamel %>.findAll` | List <%= entityPlural %> (paginated) | `{ page?, limit? }` |
| `<%= entityCamel %>.update` | Update <%= entityCamel %> | `{ id, updates }` |
| `<%= entityCamel %>.delete` | Soft delete <%= entityCamel %> | `{ id }` |

## Architecture

```
apps/<%= kebabName %>/
├── src/
│   ├── main.ts                 # TCP + HTTP bootstrap
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health checks
│   ├── configs/                # Configuration
│   ├── libs/dals/              # Data access layer
│   │   ├── configuration/      # Config service
│   │   └── mongodb/            # MongoDB + Mongoose
│   └── apps/web/               # API layer
│       ├── apis/<%= entityKebab %>/  # Entity API
│       ├── services/           # Business logic
│       └── interfaces/         # Service contracts
├── .env.example
├── .env.development
├── Dockerfile
└── tsconfig.app.json
```

## Docker

```bash
# Build image
docker build -t <%= kebabName %> -f apps/<%= kebabName %>/Dockerfile .

# Run container
docker run -p <%= port %>:<%= port %> -p <%= healthPort %>:<%= healthPort %> \
  -e DB_URL="mongodb://host.docker.internal:27017/<%= kebabName.replace(/-/g, '_') %>" \
  <%= kebabName %>
```
