---
inject: true
to: nest-cli.json
after: "\"projects\": {"
skip_if: "\"<%= kebabName %>\":"
---
    "<%= kebabName %>": {
      "type": "application",
      "root": "apps/<%= kebabName %>",
      "entryFile": "main",
      "sourceRoot": "apps/<%= kebabName %>/src",
      "compilerOptions": {
        "tsConfigPath": "apps/<%= kebabName %>/tsconfig.app.json"
      }
    },