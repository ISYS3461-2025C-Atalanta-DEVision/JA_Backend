# AdminService

A microservice for admin of JA

## Service Configuration

| Port Type | Port | Description |
|-----------|------|-------------|
| TCP | 3003 | Microservice communication |
| HTTP | 3013 | Health check endpoint |

- **Database**: MongoDB (`admin-applicants` collection)
- **Entity**: AdminApplicant

## Environment Variables

Create `.env.development` file in `apps/admin-service/`:

```bash
DB_URL="mongodb://localhost:27017/admin_service_dev"
```

## Running the Service

```bash
# Development
npm run start:admin-service:dev

# Production
npm run build:admin-service
npm run start:admin-service
```

## Health Check

```bash
curl http://localhost:3013/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "admin-service",
  "timestamp": "2025-12-10T00:00:00.000Z",
  "uptime": 10
}
```

## TCP Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `adminApplicant.create` | Create new adminApplicant | `{ name, description? }` |
| `adminApplicant.findById` | Get adminApplicant by ID | `{ id }` |
| `adminApplicant.findAll` | List admin-applicants (paginated) | `{ page?, limit? }` |
| `adminApplicant.update` | Update adminApplicant | `{ id, updates }` |
| `adminApplicant.delete` | Soft delete adminApplicant | `{ id }` |

## Architecture

```
apps/admin-service/
├── src/
│   ├── main.ts                 # TCP + HTTP bootstrap
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health checks
│   ├── configs/                # Configuration
│   ├── libs/dals/              # Data access layer
│   │   ├── configuration/      # Config service
│   │   └── mongodb/            # MongoDB + Mongoose
│   └── apps/web/               # API layer
│       ├── apis/admin-applicant/  # Entity API
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
docker build -t admin-service -f apps/admin-service/Dockerfile .

# Run container
docker run -p 3003:3003 -p 3013:3013 \
  -e DB_URL="mongodb://host.docker.internal:27017/admin_service" \
  admin-service
```
