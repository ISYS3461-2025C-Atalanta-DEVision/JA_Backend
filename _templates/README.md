# Hygen Code Generators

This directory contains Hygen templates for generating boilerplate code in the Core project.

## Available Generators

### 1. Microservice Generator (`microservice/new`)

Generates a complete new microservice with all necessary files and configuration.

**Usage:**

```bash
npm run gen:microservice
# or
npm run gen:microservice -- --name order-service
```

**Prompts:**

- Service name (kebab-case, e.g., `order-service`)
- Description
- TCP Port (default: auto-calculated)
- Database (mongodb/postgres/none)
- Include authentication? (yes/no)

**Generates:**

- `apps/[service-name]/src/main.ts` - Entry point with TCP configuration
- `apps/[service-name]/src/[service-name].module.ts` - Root module
- `apps/[service-name]/src/apis/.gitkeep` - APIs directory
- `apps/[service-name]/tsconfig.app.json` - TypeScript config
- `apps/[service-name]/README.md` - Service documentation
- Updates `.env.example` with service environment variables
- Updates `nest-cli.json` with service configuration
- Updates `package.json` with build/start scripts

**Example:**

```bash
$ npm run gen:microservice

✔ Service name (kebab-case): order-service
✔ Service description: A microservice for managing orders
✔ TCP Port: 3005
✔ Database: mongodb
✔ Include authentication?: Yes

✅ Generated:
   apps/order-service/src/main.ts
   apps/order-service/src/order-service.module.ts
   apps/order-service/src/apis/.gitkeep
   apps/order-service/tsconfig.app.json
   apps/order-service/README.md
   Updated .env.example
   Updated nest-cli.json
   Updated package.json
```

### 2. Gateway API Generator (`gateway-api/new`)

**Status:** Template structure created, implementation pending

Generates API endpoints in the API Gateway that proxy to a microservice.

**Usage:**

```bash
npm run gen:api
```

### 3. CRUD Generator (`crud/new`)

**Status:** Template structure created, implementation pending

Generates a complete CRUD feature module within a microservice.

**Usage:**

```bash
npm run gen:crud
```

### 4. Entity Generator (`entity/new`)

**Status:** Template structure created, implementation pending

Generates a TypeORM entity with repository.

**Usage:**

```bash
npm run gen:entity
```

## Helper Functions

Located in `helpers/index.js`, these utility functions are available to all templates:

- `toPascalCase(str)` - Convert to PascalCase (e.g., "user-profile" → "UserProfile")
- `toCamelCase(str)` - Convert to camelCase (e.g., "user-profile" → "userProfile")
- `toKebabCase(str)` - Convert to kebab-case (e.g., "UserProfile" → "user-profile")
- `toSnakeCase(str)` - Convert to snake_case (e.g., "UserProfile" → "user_profile")
- `pluralize(str)` - Simple pluralization (e.g., "user" → "users")
- `timestamp()` - Get current timestamp in YYMMDD-HHMM format
- `getDefaultPort(serviceName)` - Calculate default TCP port for a service
- `isValidServiceName(name)` - Validate service name format
- `copyrightHeader()` - Generate copyright header comment

## Development

### Creating New Templates

1. Create a new directory under `_templates/`:

   ```bash
   mkdir -p _templates/my-generator/new
   ```

2. Create a `prompt.js` file for interactive prompts:

   ```javascript
   module.exports = {
     prompt: async ({ prompter, args }) => {
       const questions = [
         /* ... */
       ];
       const answers = await prompter.prompt(questions);
       return answers;
     },
   };
   ```

3. Create template files with `.ejs.t` extension:

   ```
   ---
   to: path/to/generated/file.ts
   ---
   <%= content %>
   ```

4. For injections into existing files, use `inject: true`:
   ```
   ---
   inject: true
   to: existing-file.json
   after: "pattern"
   skip_if: "skip-pattern"
   ---
   new content
   ```

### Template Testing

Run the validation script:

```bash
./_templates/test-generator.sh
```

## Architecture

```
_templates/
├── helpers/
│   └── index.js           # Shared utility functions
├── microservice/
│   └── new/
│       ├── prompt.js      # Interactive prompts
│       ├── main.ts.ejs.t  # Main entry point template
│       ├── module.ts.ejs.t
│       ├── apis-structure.ejs.t
│       ├── tsconfig.json.ejs.t
│       ├── readme.ejs.t
│       ├── env-example.ejs.t
│       ├── nest-cli-update.ejs.t
│       └── package-json-scripts.ejs.t
├── gateway-api/
│   └── new/               # (To be implemented)
├── crud/
│   └── new/               # (To be implemented)
├── entity/
│   └── new/               # (To be implemented)
└── README.md              # This file
```

## Best Practices

1. **Service Naming:**
   - Use kebab-case for service names (e.g., `order-service`, `user-auth`)
   - Keep names descriptive and consistent

2. **Port Assignment:**
   - Gateway: 3000
   - Customer Service: 3002
   - Admin Service: 3003
   - New services: Auto-assigned from 3005+

3. **Database Configuration:**
   - Choose MongoDB for document-based data
   - Choose PostgreSQL for relational data
   - Choose "none" for stateless services

4. **Authentication:**
   - Include auth for user-facing services
   - Skip auth for internal utility services

## Troubleshooting

### Generator not found

```bash
npm run gen
# Should list all available generators
```

### Templates not applying

Check that:

- Template files end with `.ejs.t`
- Front matter (---) is properly formatted
- EJS syntax is correct (<%= %>)

### Helper functions not working

Ensure `helpers/index.js` exports all functions and uses `module.exports`.

## Future Enhancements

- [ ] Implement gateway-api generator
- [ ] Implement crud generator
- [ ] Implement entity generator
- [ ] Add Docker configuration templates
- [ ] Add Kubernetes manifests templates
- [ ] Add E2E test templates
- [ ] Add migration generator

## References

- [Hygen Documentation](https://www.hygen.io/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [EJS Template Syntax](https://ejs.co/)
