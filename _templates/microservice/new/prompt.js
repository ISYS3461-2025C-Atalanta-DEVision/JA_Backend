const { toPascalCase, toCamelCase, toKebabCase, isValidServiceName, getDefaultPort } = require('../../helpers');

module.exports = {
  prompt: async ({ prompter, args }) => {
    const questions = [];

    // Service name (if not provided as argument)
    if (!args.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Service name (kebab-case):',
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

    // Database type
    questions.push({
      type: 'select',
      name: 'database',
      message: 'Database:',
      choices: [
        { name: 'mongodb', message: 'MongoDB (TypeORM)' },
        { name: 'postgres', message: 'PostgreSQL (TypeORM)' },
        { name: 'none', message: 'No database' },
      ],
    });

    // Authentication
    questions.push({
      type: 'confirm',
      name: 'withAuth',
      message: 'Include authentication?',
      initial: true,
    });

    const answers = await prompter.prompt(questions);

    // Merge with args
    const name = args.name || answers.name;
    const pascalName = toPascalCase(name);
    const camelName = toCamelCase(name);
    const kebabName = toKebabCase(name);

    return {
      ...answers,
      name,
      pascalName,
      camelName,
      kebabName,
    };
  },
};
