# JobSkillService

A microservice for admin manage job category and job skill

## Service Configuration

| Port Type | Port | Description |
|-----------|------|-------------|
| TCP | 3004 | Microservice communication |
| HTTP | 3014 | Health check endpoint |

- **Database**: MongoDB (`job-categories` collection)
- **Entity**: JobCategory

## Environment Variables

Create `.env.development` file in `apps/job-skill-service/`:

```bash
DB_URL="mongodb://localhost:27017/job_skill_service_dev"
```

## Running the Service

```bash
# Development
npm run start:job-skill-service:dev

# Production
npm run build:job-skill-service
npm run start:job-skill-service
```

## Health Check

```bash
curl http://localhost:3014/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "job-skill-service",
  "timestamp": "2025-12-10T00:00:00.000Z",
  "uptime": 10
}
```

## TCP Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `jobCategory.create` | Create new jobCategory | `{ name, description? }` |
| `jobCategory.findById` | Get jobCategory by ID | `{ id }` |
| `jobCategory.findAll` | List job-categories (paginated) | `{ page?, limit? }` |
| `jobCategory.update` | Update jobCategory | `{ id, updates }` |
| `jobCategory.delete` | Soft delete jobCategory | `{ id }` |

## Architecture

```
apps/job-skill-service/
├── src/
│   ├── main.ts                 # TCP + HTTP bootstrap
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health checks
│   ├── configs/                # Configuration
│   ├── libs/dals/              # Data access layer
│   │   ├── configuration/      # Config service
│   │   └── mongodb/            # MongoDB + Mongoose
│   └── apps/web/               # API layer
│       ├── apis/job-category/  # Entity API
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
docker build -t job-skill-service -f apps/job-skill-service/Dockerfile .

# Run container
docker run -p 3004:3004 -p 3014:3014 \
  -e DB_URL="mongodb://host.docker.internal:27017/job_skill_service" \
  job-skill-service
```
