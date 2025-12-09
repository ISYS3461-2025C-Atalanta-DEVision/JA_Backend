---
to: _manual/nest-cli-<%= kebabName %>.json
message: |

  ⚠️  MANUAL STEP REQUIRED:

  Add the following to your nest-cli.json under "projects":

  "<%= kebabName %>": {
    "type": "application",
    "root": "apps/<%= kebabName %>",
    "entryFile": "main",
    "sourceRoot": "apps/<%= kebabName %>/src",
    "compilerOptions": {
      "tsConfigPath": "apps/<%= kebabName %>/tsconfig.app.json"
    }
  }

---
{
  "<%= kebabName %>": {
    "type": "application",
    "root": "apps/<%= kebabName %>",
    "entryFile": "main",
    "sourceRoot": "apps/<%= kebabName %>/src",
    "compilerOptions": {
      "tsConfigPath": "apps/<%= kebabName %>/tsconfig.app.json"
    }
  }
}
