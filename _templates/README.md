# Hygen Code Generators

This directory contains Hygen templates for generating boilerplate code in the Vietnam New Address Core project.

## Available Generators

### 1. Microservice Generator (`microservice/new`)

Generates a complete new microservice matching the applicant-service architecture with MongoDB, Mongoose, and full CRUD operations.

**Usage:**

```bash
npm run gen:microservice
# or
npm run gen:microservice -- --name order-service
```

**Prompts:**

1. **Service name** (kebab-case) - e.g., `order-service`
2. **Description** - Service description
3. **TCP Port** - Microservice TCP port (default: auto-calculated)
4. **Health Port** - Health check HTTP port (default: TCP port + 10)
5. **Entity Name** (singular, kebab-case) - e.g., `order`

**Generates (~55 files):**

```
apps/{service-name}/
├── src/
│   ├── main.ts                              # TCP + HTTP bootstrap
│   ├── app.module.ts                        # Root module
│   ├── health.controller.ts                 # Health endpoints
│   ├── configs/                             # Configuration
│   │   ├── app.config.ts
│   │   └── index.ts
│   ├── libs/
│   │   ├── index.ts
│   │   ├── imports.ts
│   │   └── dals/
│   │       ├── configuration/               # Config module
│   │       │   ├── configuration.module.ts
│   │       │   ├── providers.ts
│   │       │   ├── constants.ts
│   │       │   ├── services/
│   │       │   │   ├── app-config.service.ts
│   │       │   │   └── index.ts
│   │       │   └── interfaces/
│   │       │       ├── app-config-service.interface.ts
│   │       │       └── index.ts
│   │       └── mongodb/                     # MongoDB module
│   │           ├── mongodb.module.ts
│   │           ├── providers.ts
│   │           ├── constants.ts
│   │           ├── schemas/
│   │           │   ├── {entity}.schema.ts
│   │           │   └── index.ts
│   │           ├── repositories/
│   │           │   ├── base.repository.ts
│   │           │   ├── {entity}.repository.ts
│   │           │   └── index.ts
│   │           └── interfaces/
│   │               ├── base-repository.interface.ts
│   │               ├── {entity}-repository.interface.ts
│   │               └── index.ts
│   └── apps/
│       ├── index.ts
│       └── web/
│           ├── index.ts
│           ├── providers.ts
│           ├── constants.ts
│           ├── apis/
│           │   ├── index.ts
│           │   └── {entity}/
│           │       ├── {entity}.module.ts
│           │       ├── index.ts
│           │       ├── controllers/
│           │       │   ├── {entity}.controller.ts
│           │       │   └── index.ts
│           │       └── dtos/
│           │           ├── index.ts
│           │           ├── requests/
│           │           │   ├── create-{entity}.dto.ts
│           │           │   ├── update-{entity}.dto.ts
│           │           │   └── index.ts
│           │           └── responses/
│           │               ├── {entity}-response.dto.ts
│           │               └── index.ts
│           ├── services/
│           │   ├── {entity}.service.ts
│           │   └── index.ts
│           └── interfaces/
│               ├── {entity}-service.interface.ts
│               └── index.ts
├── .env.example
├── .env.development
├── Dockerfile
├── README.md
└── tsconfig.app.json
```

**Post-Generation Steps:**

After running the generator, you need to manually update:

1. **nest-cli.json** - Add service configuration (see `_manual/nest-cli-{service}.json`)
2. **package.json** - Add build/start scripts (see `_manual/package-scripts-{service}.json`)

**Example:**

```bash
$ npm run gen:microservice

✔ Service name (kebab-case): orderService
✔ Service description: Microservice for order management
✔ TCP Port: 3006
✔ Health HTTP Port: 3016
✔ Entity name (singular): order

✅ Generated 55 files in apps/order-service/

⚠️  MANUAL STEPS:
1. Update nest-cli.json (see _manual/nest-cli-order-service.json)
2. Update package.json (see _manual/package-scripts-order-service.json)

$ npm run start:order-service:dev
```

## Helper Functions

Located in `helpers/index.js`, these utility functions are available to all templates:

| Function                     | Example           | Output            |
| ---------------------------- | ----------------- | ----------------- |
| `toPascalCase(str)`          | `'user-profile'`  | `'UserProfile'`   |
| `toCamelCase(str)`           | `'user-profile'`  | `'userProfile'`   |
| `toKebabCase(str)`           | `'UserProfile'`   | `'user-profile'`  |
| `toSnakeCase(str)`           | `'UserProfile'`   | `'user_profile'`  |
| `toUpperSnakeCase(str)`      | `'order-service'` | `'ORDER_SERVICE'` |
| `pluralize(str)`             | `'order'`         | `'orders'`        |
| `timestamp()`                | -                 | `'251210-0319'`   |
| `getDefaultPort(name)`       | `'order-service'` | `3006`            |
| `getDefaultHealthPort(port)` | `3006`            | `3016`            |
| `isValidServiceName(name)`   | `'order-service'` | `true`            |
| `isValidEntityName(name)`    | `'order'`         | `true`            |
| `copyrightHeader()`          | -                 | Copyright comment |

## Port Assignment

| Service              | TCP Port  | Health Port |
| -------------------- | --------- | ----------- |
| API Gateway          | 3000      | -           |
| Applicant Service    | 3002      | 3012        |
| Admin Service        | 3003      | 3013        |
| Auth Service         | 3004      | 3014        |
| Address Service      | 3005      | 3015        |
| Order Service        | 3006      | 3016        |
| Product Service      | 3007      | 3017        |
| Notification Service | 3008      | 3018        |
| Other Services       | 3010-3095 | +10         |

## Architecture Patterns

### TCP Message Patterns

```typescript
@MessagePattern({ cmd: 'entity.create' })
@MessagePattern({ cmd: 'entity.findById' })
@MessagePattern({ cmd: 'entity.findAll' })
@MessagePattern({ cmd: 'entity.update' })
@MessagePattern({ cmd: 'entity.delete' })
```

### Symbol-Based DI

```typescript
// constants.ts
export const ENTITY_REPO_PROVIDER = Symbol('EntityRepositoryProvider');
export const ENTITY_SERVICE_WEB_PROVIDER = Symbol('EntityServiceWebProvider');

// providers.ts
export const EntityRepositoryProvider: Provider<IEntityRepository> = {
  provide: ENTITY_REPO_PROVIDER,
  useClass: EntityRepository,
};

// controller.ts
@Inject(ENTITY_SERVICE_WEB_PROVIDER)
private readonly entityService: IEntityService
```

## Troubleshooting

### Generator not found

```bash
npm run gen
# Should list all available generators
```

### Missing environment file

Create `.env.development` in `apps/{service}/`:

```bash
DB_URL=mongodb://localhost:27017/{service}_dev
```

### TypeScript errors after generation

```bash
# Check imports resolve correctly
npx tsc --noEmit -p apps/{service}/tsconfig.app.json
```

## Future Enhancements

- [ ] Implement gateway-api generator
- [ ] Implement crud generator (add entity to existing service)
- [ ] Add PostgreSQL support
- [ ] Add Kafka transport option
- [ ] Add E2E test templates
- [ ] Add migration generator

## References

- [Hygen Documentation](https://www.hygen.io/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
