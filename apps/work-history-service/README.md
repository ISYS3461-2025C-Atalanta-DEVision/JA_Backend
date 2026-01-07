# WorkHistoryService

Service to handle work history of applicant

## Service Configuration

| Port Type | Port | Description |
|-----------|------|-------------|
| TCP | 3088 | Microservice communication |
| HTTP | 3010 | Health check endpoint |

- **Database**: MongoDB (`work-histories` collection)
- **Entity**: WorkHistory

## Environment Variables

Create `.env.development` file in `apps/work-history-service/`:

```bash
DB_URL="mongodb://localhost:27017/work_history_service_dev"
```

## Running the Service

```bash
# Development
npm run start:work-history-service:dev

# Production
npm run build:work-history-service
npm run start:work-history-service
```

## Health Check

```bash
curl http://localhost:3010/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "work-history-service",
  "timestamp": "2025-12-10T00:00:00.000Z",
  "uptime": 10
}
```

## TCP Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `workHistory.create` | Create new workHistory | `{ name, description? }` |
| `workHistory.findById` | Get workHistory by ID | `{ id }` |
| `workHistory.findAll` | List work-histories (paginated) | `{ page?, limit? }` |
| `workHistory.update` | Update workHistory | `{ id, updates }` |
| `workHistory.delete` | Soft delete workHistory | `{ id }` |

## Architecture

```
apps/work-history-service/
├── src/
│   ├── main.ts                 # TCP + HTTP bootstrap
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health checks
│   ├── configs/                # Configuration
│   ├── libs/dals/              # Data access layer
│   │   ├── configuration/      # Config service
│   │   └── mongodb/            # MongoDB + Mongoose
│   └── apps/web/               # API layer
│       ├── apis/work-history/  # Entity API
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
docker build -t work-history-service -f apps/work-history-service/Dockerfile .

# Run container
docker run -p 3088:3088 -p 3010:3010 \
  -e DB_URL="mongodb://host.docker.internal:27017/work_history_service" \
  work-history-service
```
