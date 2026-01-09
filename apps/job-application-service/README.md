# JobApplicationService

Microservice for when an applicant apply to a job

## Service Configuration

| Port Type | Port | Description |
|-----------|------|-------------|
| TCP | 3088 | Microservice communication |
| HTTP | 3018 | Health check endpoint |

- **Database**: MongoDB (`job-applications` collection)
- **Entity**: JobApplication

## Environment Variables

Create `.env.development` file in `apps/job-application-service/`:

```bash
DB_URL="mongodb://localhost:27017/job_application_service_dev"
```

## Running the Service

```bash
# Development
npm run start:job-application-service:dev

# Production
npm run build:job-application-service
npm run start:job-application-service
```

## Health Check

```bash
curl http://localhost:3018/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "job-application-service",
  "timestamp": "2025-12-10T00:00:00.000Z",
  "uptime": 10
}
```

## TCP Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `jobApplication.create` | Create new jobApplication | `{ name, description? }` |
| `jobApplication.findById` | Get jobApplication by ID | `{ id }` |
| `jobApplication.findAll` | List job-applications (paginated) | `{ page?, limit? }` |
| `jobApplication.update` | Update jobApplication | `{ id, updates }` |
| `jobApplication.delete` | Soft delete jobApplication | `{ id }` |

## Architecture

```
apps/job-application-service/
├── src/
│   ├── main.ts                 # TCP + HTTP bootstrap
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health checks
│   ├── configs/                # Configuration
│   ├── libs/dals/              # Data access layer
│   │   ├── configuration/      # Config service
│   │   └── mongodb/            # MongoDB + Mongoose
│   └── apps/web/               # API layer
│       ├── apis/job-application/  # Entity API
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
docker build -t job-application-service -f apps/job-application-service/Dockerfile .

# Run container
docker run -p 3088:3088 -p 3018:3018 \
  -e DB_URL="mongodb://host.docker.internal:27017/job_application_service" \
  job-application-service
```
