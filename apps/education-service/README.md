# EducationService

A microservice for the application

## Service Configuration

| Port Type | Port | Description |
|-----------|------|-------------|
| TCP | 3088 | Microservice communication |
| HTTP | 3015 | Health check endpoint |

- **Database**: MongoDB (`educations` collection)
- **Entity**: Education

## Environment Variables

Create `.env.development` file in `apps/education-service/`:

```bash
DB_URL="mongodb://localhost:27017/education_service_dev"
```

## Running the Service

```bash
# Development
npm run start:education-service:dev

# Production
npm run build:education-service
npm run start:education-service
```

## Health Check

```bash
curl http://localhost:3015/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "education-service",
  "timestamp": "2025-12-10T00:00:00.000Z",
  "uptime": 10
}
```

## TCP Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `education.create` | Create new education | `{ name, description? }` |
| `education.findById` | Get education by ID | `{ id }` |
| `education.findAll` | List educations (paginated) | `{ page?, limit? }` |
| `education.update` | Update education | `{ id, updates }` |
| `education.delete` | Soft delete education | `{ id }` |

## Architecture

```
apps/education-service/
├── src/
│   ├── main.ts                 # TCP + HTTP bootstrap
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health checks
│   ├── configs/                # Configuration
│   ├── libs/dals/              # Data access layer
│   │   ├── configuration/      # Config service
│   │   └── mongodb/            # MongoDB + Mongoose
│   └── apps/web/               # API layer
│       ├── apis/education/  # Entity API
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
docker build -t education-service -f apps/education-service/Dockerfile .

# Run container
docker run -p 3088:3088 -p 3015:3015 \
  -e DB_URL="mongodb://host.docker.internal:27017/education_service" \
  education-service
```
