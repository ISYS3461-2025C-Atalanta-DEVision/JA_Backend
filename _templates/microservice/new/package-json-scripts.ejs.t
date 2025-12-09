---
inject: true
to: package.json
after: "\"scripts\": {"
skip_if: "\"build:<%= kebabName %>\":"
---
    "build:<%= kebabName %>": "nest build <%= kebabName %>",
    "start:<%= kebabName %>": "nest start <%= kebabName %>",
    "start:<%= kebabName %>:dev": "nest start <%= kebabName %> --watch",