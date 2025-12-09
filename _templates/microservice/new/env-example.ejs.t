---
inject: true
to: .env.example
after: "# Microservices Configuration"
skip_if: <%= name.toUpperCase().replace(/-/g, '_') %>_
---
# <%= pascalName %> Service
<%= name.toUpperCase().replace(/-/g, '_') %>_HOST=localhost
<%= name.toUpperCase().replace(/-/g, '_') %>_PORT=<%= port %>
<% if (database === 'mongodb') { %>
# <%= pascalName %> MongoDB
<%= name.toUpperCase().replace(/-/g, '_') %>_MONGODB_URI=mongodb://localhost:27017
<%= name.toUpperCase().replace(/-/g, '_') %>_MONGODB_DATABASE=<%= kebabName %>
<% } else if (database === 'postgres') { %>
# <%= pascalName %> PostgreSQL
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_HOST=localhost
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_PORT=5432
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_USERNAME=postgres
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_PASSWORD=postgres
<%= name.toUpperCase().replace(/-/g, '_') %>_DB_DATABASE=<%= kebabName %>
<% } %>
