# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the job-skill-service
RUN npm run build:job-skill-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files and dependencies
COPY --from=builder /app/dist/apps/job-skill-service ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Expose TCP port for microservice + HTTP port for health checks
EXPOSE 3004 3014

# Health check via HTTP health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3014/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
