---
to: apps/<%= kebabName %>/.env.example
---
# <%= pascalName %> Service Configuration

# MongoDB Connection
DB_URL=mongodb://localhost:27017/<%= kebabName.replace(/-/g, '_') %>

# Service Ports
# TCP Port (for microservice communication)
# <%= serviceEnvPrefix %>_PORT=<%= port %>
# Health Check HTTP Port
# HEALTH_PORT=<%= healthPort %>
