# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the work-history-service
RUN npm run build:work-history-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files and dependencies
COPY --from=builder /app/dist/apps/work-history-service ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Expose TCP port for microservice + HTTP port for health checks
EXPOSE 3088 3010

# Health check via HTTP health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3010/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
