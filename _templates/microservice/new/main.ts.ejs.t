---
to: apps/<%= kebabName %>/src/main.ts
---
<% const { copyrightHeader } = require('../../helpers'); %>
<%= copyrightHeader() %>

import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { <%= pascalName %>Module } from './<%= kebabName %>.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(<%= pascalName %>Module);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    <%= pascalName %>Module,
    {
      transport: Transport.TCP,
      options: {
        host: configService.get<string>('<%= name.toUpperCase().replace(/-/g, '_') %>_HOST') || 'localhost',
        port: configService.get<number>('<%= name.toUpperCase().replace(/-/g, '_') %>_PORT') || <%= port %>,
      },
    },
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();

  const port = configService.get<number>('<%= name.toUpperCase().replace(/-/g, '_') %>_PORT') || <%= port %>;
  console.log(`🚀 <%= pascalName %> is listening on TCP port ${port}`);
}

bootstrap();
