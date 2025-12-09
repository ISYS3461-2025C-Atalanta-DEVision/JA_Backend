const {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toUpperSnakeCase,
  pluralize,
  isValidServiceName,
  isValidEntityName,
  getDefaultPort,
  getDefaultHealthPort,
} = require('../../helpers');

module.exports = {
  prompt: async ({ prompter, args }) => {
    const questions = [];

    // Service name (if not provided as argument)
    if (!args.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Service name (kebab-case, e.g., order-service):',
        validate: (input) => {
          if (!input) return 'Service name is required';
          if (!isValidServiceName(input)) {
            return 'Service name must be lowercase, alphanumeric, and use hyphens only (e.g., order-service)';
          }
          return true;
        },
      });
    }

    // Description
    questions.push({
      type: 'input',
      name: 'description',
      message: 'Service description:',
      initial: 'A microservice for the application',
    });

    // TCP Port
    questions.push({
      type: 'input',
      name: 'port',
      message: 'TCP Port:',
      initial: ({ name }) => String(getDefaultPort(name || args.name)),
      validate: (input) => {
        const port = parseInt(input);
        if (isNaN(port) || port < 1024 || port > 65535) {
          return 'Port must be a number between 1024 and 65535';
        }
        return true;
      },
    });

    // Health HTTP Port
    questions.push({
      type: 'input',
      name: 'healthPort',
      message: 'Health HTTP Port (for health checks):',
      initial: ({ port }) => String(getDefaultHealthPort(port)),
      validate: (input) => {
        const port = parseInt(input);
        if (isNaN(port) || port < 1024 || port > 65535) {
          return 'Port must be a number between 1024 and 65535';
        }
        return true;
      },
    });

    // Entity name (singular)
    questions.push({
      type: 'input',
      name: 'entityName',
      message: 'Entity name (singular, kebab-case, e.g., order):',
      initial: ({ name }) => {
        // Extract entity from service name: order-service -> order
        const serviceName = name || args.name;
        return serviceName.replace(/-service$/, '').replace(/-svc$/, '');
      },
      validate: (input) => {
        if (!input) return 'Entity name is required';
        if (!isValidEntityName(input)) {
          return 'Entity name must be singular (not ending with "s"), lowercase, alphanumeric (e.g., order, product, user-profile)';
        }
        return true;
      },
    });

    const answers = await prompter.prompt(questions);

    // Merge with args
    const name = args.name || answers.name;
    const entityName = answers.entityName;

    // Service name variations
    const pascalName = toPascalCase(name);
    const camelName = toCamelCase(name);
    const kebabName = toKebabCase(name);

    // Entity name variations
    const entityPascal = toPascalCase(entityName);
    const entityCamel = toCamelCase(entityName);
    const entityKebab = toKebabCase(entityName);
    const entityPlural = pluralize(entityName);
    const entityPluralCamel = toCamelCase(entityPlural);
    const entityPluralPascal = toPascalCase(entityPlural);
    const entityUpperSnake = toUpperSnakeCase(entityName);

    // Service env prefix (ORDER_SERVICE -> ORDER_SERVICE)
    const serviceEnvPrefix = toUpperSnakeCase(name);

    return {
      ...answers,
      name,
      pascalName,
      camelName,
      kebabName,
      entityName,
      entityPascal,
      entityCamel,
      entityKebab,
      entityPlural,
      entityPluralCamel,
      entityPluralPascal,
      entityUpperSnake,
      serviceEnvPrefix,
    };
  },
};
