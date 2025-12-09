---
to: _manual/package-scripts-<%= kebabName %>.json
message: |

  ⚠️  MANUAL STEP REQUIRED:

  Add the following to your package.json under "scripts":

  "build:<%= kebabName %>": "nest build <%= kebabName %>",
  "start:<%= kebabName %>": "nest start <%= kebabName %>",
  "start:<%= kebabName %>:dev": "nest start <%= kebabName %> --watch",
  "start:<%= kebabName %>:debug": "nest start <%= kebabName %> --debug --watch"

---
{
  "build:<%= kebabName %>": "nest build <%= kebabName %>",
  "start:<%= kebabName %>": "nest start <%= kebabName %>",
  "start:<%= kebabName %>:dev": "nest start <%= kebabName %> --watch",
  "start:<%= kebabName %>:debug": "nest start <%= kebabName %> --debug --watch"
}
