# JA backend core microservice

A **microservices-based** backend API system built with NestJS

## Quick Overview

**Architecture**: Microservices with API Gateway pattern
**Current Services**: Applicant Service (✅ Complete), Address Service (🔄 Planned)
**Transport**: TCP for inter-service, HTTP/REST for external clients
**Authentication**: ✅ **JWE + Firebase Google Auth** with Argon2id hashing

**Key Features**:

- 🏗️ Microservices architecture with NestJS + TCP
- 🔐 **Full authentication system** (Email/Password + Firebase Google Auth)
- 👥 Applicant management with CRUD operations + auth
- 🗺️ Address mapping: Old → New administrative structure (planned)
- 🚀 API Gateway with HTTP → TCP proxy pattern
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
API Gateway (Port 3000)
    ↓ TCP Messages (5s timeout)
    └─→ Applicant Service (Port 3002, Health 3012) → MongoDB (applicants)
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
JWE_SECRET=your-jwe-secret-key-32-chars-min
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
```

## Running the Services

### Development

Start services in **2 separate terminals**:

**Terminal 1 - Applicant Service**:

```bash
npm run start:applicant-service:dev
# Listens on TCP port 3002
```

**Terminal 2 - API Gateway**:

```bash
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
GET  /countries                      # Get list of countries
```

### Applicant Management

**Base URL**: `http://localhost:3000`

```bash
# Create applicant
POST /applicants
Body: { name, email, phone?, address?, addressProvinceCode?, country }

# Get applicant by ID
GET /applicants/:id

# List applicants (paginated)
GET /applicants?page=1&limit=10

# Update applicant
PUT /applicants/:id
Body: { name?, email?, phone?, address?, addressProvinceCode?, country?, isActive? }

# Delete applicant (soft delete)
DELETE /applicants/:id

# Health check
GET /health  # Port 3012
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
