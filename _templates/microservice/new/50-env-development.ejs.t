---
to: apps/<%= kebabName %>/.env.development
---
# <%= pascalName %> Service - Development Configuration

# MongoDB Connection (update with your connection string)
DB_URL=mongodb://localhost:27017/<%= kebabName.replace(/-/g, '_') %>_dev
