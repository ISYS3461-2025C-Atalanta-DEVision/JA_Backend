# JA backend core microservice

A **microservices-based** backend API system built with NestJS

## Quick Overview

**Architecture**: Microservices with API Gateway pattern
**Current Services**: API Gateway, Applicant Service, Admin Service, Job-Skill Service (✅ All running)
**Transport**: TCP for inter-service, HTTP/REST for external clients
**Authentication**: ✅ **JWE + Firebase Google Auth** + API Key with Argon2id hashing

**Key Features**:

- 🏗️ Microservices architecture with NestJS + TCP
- 🔐 **Full authentication system** (JWE + Firebase Google Auth + API Key)
- 👥 Applicant & Admin management with CRUD + auth
- 💼 Job categories and skills management
- 🚀 API Gateway with HTTP → TCP proxy pattern
- 🛡️ Global JWE auth + @Public() and @ApiKeyAuth() decorators
- 📚 Comprehensive API documentation

## Tech Stack

- **Architecture**: Microservices (NestJS monorepo)
- **Framework**: NestJS 11.1.8 + @nestjs/microservices 11.1.8
- **Language**: TypeScript 5.7.3
- **Transport**: TCP (current), Kafka (planned)
- **Database**: MongoDB 6.17.0 (per-service databases)
- **ORM**: Mongoose 8.20.2 (@nestjs/mongoose 11.0.3)
- **Authentication**: JWE + Firebase Admin SDK 13.6.0
- **Password Hashing**: Argon2id (@node-rs/argon2 2.0.2)
- **Token Encryption**: Jose library (JWE A256GCM)
- **Validation**: class-validator + class-transformer
- **Security**: Helmet, CORS, Throttler (rate limiting)
- **Testing**: Jest
- **Logging**: Pino

## Architecture

```
External Clients (HTTP)
    ↓
API Gateway (Port 3000) - Global JweAuthGuard + @Public/@ApiKeyAuth
    ↓ TCP Messages (5s timeout)
    ├─→ Applicant Service (Port 3002, Health 3012) → MongoDB (vietnam_applicants)
    ├─→ Admin Service (Port 3003, Health 3013) → MongoDB (vietnam_admins)
    └─→ Job-Skill Service (Port 3004, Health 3014) → MongoDB (vietnam_job_skills)
```

## Installation

### Prerequisites

- Node.js 18+ LTS
- MongoDB 6.0+ (or Docker)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/db

# Server
PORT=3000

# Firebase Admin SDK (for Google Sign-In)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# JWE Token Encryption
JWE_ACCESS_SECRET=your-jwe-access-secret-32-chars
JWE_REFRESH_SECRET=your-jwe-refresh-secret-32-chars
JWT_SECRET_APPLICANT=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# API Key for external service access
API_KEY=your-secret-api-key-here-min-32-chars

# Redis (optional - for token revocation)
REDIS_URL=redis://localhost:6379
```

## Running the Services

### Development

Start services in **separate terminals** (4 services + API Gateway):

```bash
# Terminal 1 - Applicant Service
npm run start:applicant-service:dev
# TCP port 3002, Health port 3012

# Terminal 2 - Admin Service
npm run start:admin-service:dev
# TCP port 3003, Health port 3013

# Terminal 3 - Job-Skill Service
npm run start:job-skill-service:dev
# TCP port 3004, Health port 3014

# Terminal 4 - API Gateway
npm run start:api-gateway:dev
# HTTP server on port 3000
```

The API Gateway will be available at `http://localhost:3000`

### Production

```bash
# Build all services
npm run build

# Start services
npm run start:applicant-service
npm run start:admin-service
npm run start:job-skill-service
npm run start:api-gateway
```

## API Endpoints

### Authentication

**Applicant Auth**:

```bash
POST /auth/applicant/register        # Register with email/password
POST /auth/applicant/login           # Login (brute force protected)
POST /auth/applicant/refresh         # Refresh access token
POST /auth/applicant/firebase/google # Firebase Google Sign-In
POST /auth/applicant/logout          # Logout
```

**Admin Auth**:

```bash
POST /auth/admin/register            # Register admin with email/password
POST /auth/admin/login               # Admin login (brute force protected)
POST /auth/admin/refresh             # Refresh admin access token
POST /auth/admin/firebase/google     # Admin Firebase Google Sign-In
POST /auth/admin/logout              # Admin logout
```

**Utility**:

```bash
GET  /countries                      # Get list of countries (@Public)
```

### Applicant Management

**Requires**: `@ApiKeyAuth()` - JWE token OR API Key (X-API-Key header)

```bash
POST   /applicants          # Create applicant
GET    /applicants/:id      # Get applicant by ID
GET    /applicants          # List applicants (paginated)
PUT    /applicants/:id      # Update applicant
DELETE /applicants/:id      # Soft delete applicant
```

### Admin Management

**Requires**: Admin role (via JWE token)

```bash
POST   /admins              # Create admin
GET    /admins/:id          # Get admin by ID
GET    /admins              # List admins (paginated)
PUT    /admins/:id          # Update admin
DELETE /admins/:id          # Soft delete admin
```

### Job Category Management

**Public**: Create/Update/Delete require admin role

```bash
POST   /job-categories      # Create category (admin only)
GET    /job-categories/:id  # Get category (@Public)
GET    /job-categories      # List categories (@Public)
PUT    /job-categories/:id  # Update category (admin only)
DELETE /job-categories/:id  # Soft delete (admin only)
```

### Skill Management

**Public**: Read operations; Create/Update/Delete require admin OR API Key

```bash
POST   /skills              # Create skill (@ApiKeyAuth)
GET    /skills/:id          # Get skill (@Public)
GET    /skills              # List skills (@Public)
GET    /skills/category/:categoryId  # List by category (@Public)
PUT    /skills/:id          # Update skill (@ApiKeyAuth)
DELETE /skills/:id          # Soft delete (@ApiKeyAuth)
```

### Health Checks

```bash
GET /health                 # API Gateway health
GET /health/applicant       # Applicant Service health (port 3012)
GET /health/admin           # Admin Service health (port 3013)
GET /health/job-skill       # Job-Skill Service health (port 3014)
```

**Example - Register + Login**:

```bash
# Register a new applicant
curl -X POST http://localhost:3000/auth/applicant/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:3000/auth/applicant/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt

# Access protected endpoint
curl -X GET http://localhost:3000/applicants \
  -b cookies.txt
```

## Authentication & Authorization

### Global Authentication

The API Gateway uses a **Global `JweAuthGuard`** that validates JWE tokens on all routes by default. Routes can opt-out using decorators:

- **`@Public()`**: Skip all authentication (public endpoints)
- **`@ApiKeyAuth()`**: Allow JWE token OR API Key authentication

### JWE Token Authentication

**How it works**:
1. User logs in → Receives JWE access token (30m) + refresh token (7d)
2. Tokens stored in HTTP-only cookies (secure)
3. Access token contains: user ID, email, role, country
4. Guard validates and decrypts JWE on each request
5. User info available via `@CurrentUser()` decorator

**Token Storage**:
- Access tokens: JWE encrypted with A256GCM
- Refresh tokens: SHA-256 hashed in database

### API Key Authentication

For external service-to-service communication:

```bash
# Using API Key (no user context)
curl -X GET http://localhost:3000/applicants \
  -H "X-API-Key: your-secret-api-key"

# Using JWE token (user context available)
curl -X GET http://localhost:3000/applicants \
  -H "Authorization: Bearer <jwe-token>"
```

**API Key Behavior**:
- Bypasses role checks (full access)
- No user context (`@CurrentUser()` is undefined)
- Use on endpoints marked with `@ApiKeyAuth()`

### Future: Address Management (Planned)

```bash
# Address search (Phase 3)
GET /address-search?query=Xã Tân Thành, Huyện Cần Giuộc

# Geospatial lookup (Phase 3)
GET /address-search/location?lat=10.5678&lon=106.1234

# List new provinces (Phase 3)
GET /new-provinces
```

## Project Structure

```

├── apps/                           # Microservices
│   ├── api-gateway/                # HTTP REST Gateway (Port 3000)
│   │   └── src/
│   │       ├── apis/               # Feature modules
│   │       │   ├── applicant/      # Applicant HTTP → TCP proxy
│   │       │   └── auth/           # Auth controllers
│   │       ├── security/           # Guards and decorators
│   │       └── main.ts
│   └── applicant-service/          # Applicant Microservice (Port 3002)
│       └── src/
│           ├── apps/web/
│           │   ├── apis/           # Applicant + Auth APIs
│           │   ├── services/       # Business logic
│           │   └── interfaces/
│           ├── libs/dals/mongodb/  # Mongoose schemas + repos
│           └── main.ts
├── libs/                           # Shared libraries
│   ├── common/                     # Utilities, enums, interfaces
│   └── dals/                       # Data access layer
├── docs/                           # Documentation
├── nest-cli.json                   # Monorepo config
└── package.json                    # Dependencies and scripts
```

## Data Models

### Applicant (Mongoose Schema)

```typescript
{
  _id: ObjectId
  name: string (required)
  email: string (required, unique)
  phone?: string
  address?: string
  addressProvinceCode?: string
  addressProvinceName?: string
  country: string (required, ISO 3166-1 alpha-2)
  passwordHash?: string        // Argon2id hash
  emailVerified: boolean (default: false)
  loginAttempts: number (default: 0)
  lockUntil?: Date            // Brute force protection
  lastLoginAt?: Date
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### OAuthAccount (Token Storage)

```typescript
{
  _id: ObjectId;
  applicantId: string;
  provider: "email" | "google";
  providerId: string;
  accessToken: string;          // JWE encrypted (A256GCM)
  accessTokenExp: Date;         // 30 min expiry
  refreshTokenHash: string;     // SHA-256 hash
  refreshTokenExp: Date;        // 7 days expiry
  createdAt: Date;
  updatedAt: Date;
}
```

## Code Generation (Hygen)

This project uses [Hygen](https://www.hygen.io/) to generate boilerplate code for new microservices.

### Generate New Microservice

```bash
# Interactive mode
npm run gen:microservice

# With service name argument
npm run gen:microservice -- --name order-service
```

**Prompts:**

| Prompt         | Example           | Description                          |
| -------------- | ----------------- | ------------------------------------ |
| Service name   | `order-service`   | Kebab-case service name              |
| Description    | `Order management`| Service description                  |
| TCP Port       | `3006`            | Microservice TCP port                |
| Health Port    | `3016`            | Health check HTTP port (TCP + 10)    |
| Entity name    | `order`           | Singular entity name (kebab-case)    |

**Generated Structure (~55 files):**

```
apps/{service-name}/
├── src/
│   ├── main.ts                    # TCP + HTTP bootstrap
│   ├── app.module.ts              # Root module
│   ├── health.controller.ts       # Health endpoints
│   ├── configs/                   # Configuration
│   ├── libs/dals/
│   │   ├── configuration/         # Config module + service
│   │   └── mongodb/               # Schemas, repositories, interfaces
│   └── apps/web/
│       ├── apis/{entity}/         # Controller, DTOs, module
│       ├── services/              # Business logic
│       └── interfaces/            # Service interfaces
├── .env.example
├── .env.development
├── Dockerfile
├── README.md
└── tsconfig.app.json
```

**Post-Generation Steps:**

After running the generator, manually update:

1. **nest-cli.json** - Add service configuration (see `_manual/nest-cli-{service}.json`)
2. **package.json** - Add build/start scripts (see `_manual/package-scripts-{service}.json`)

**Port Assignment:**

| Service              | TCP Port | Health Port |
| -------------------- | -------- | ----------- |
| API Gateway          | 3000     | -           |
| Applicant Service    | 3002     | 3012        |
| Admin Service        | 3003     | 3013        |
| Job-Skill Service    | 3004     | 3014        |
| Address Service      | 3005     | 3015        |
| Order Service        | 3006     | 3016        |
| Other Services       | 3007+    | +10         |

### Other Generators (Planned)

```bash
npm run gen:api      # Generate API Gateway route
npm run gen:crud     # Add CRUD entity to existing service
npm run gen:entity   # Generate entity schema
```

For detailed generator documentation, see [`_templates/README.md`](./_templates/README.md).

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Test with coverage
npm run test:cov
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Project Overview & PDR](/docs/project-overview-pdr.md)**: Microservices architecture, requirements, use cases
- **[Codebase Summary](/docs/codebase-summary.md)**: Detailed microservices structure and components
- **[Code Standards](/docs/code-standards.md)**: Coding conventions, microservices patterns
- **[System Architecture](/docs/system-architecture.md)**: Architecture diagrams, TCP communication flows
- **[Project Roadmap](/docs/project-roadmap.md)**: Development phases and future plans

## Docker Deployment

```bash
# Start all services (app + MongoDB)
docker-compose up

# Stop services
docker-compose down
```

## Troubleshooting

**MongoDB connection failed**: Check MongoDB is running (`docker ps` or `systemctl status mongod`)
**Port in use**: Change ports in `.env` (PORT, APPLICANT_SERVICE_PORT)
**Service communication failed**: Ensure Applicant Service started before API Gateway

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow code standards (see `/docs/code-standards.md`)
4. Write tests for new features
5. Commit with conventional commits: `feat: add new feature`
6. Push and create a pull request

## License

MIT License - see LICENSE file for details

---

**Version**: 1.0.0
**Last Updated**: 2025-12-10
**Maintained by**: JA backend core microservice
