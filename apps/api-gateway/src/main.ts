import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  Logger.log('Starting API Gateway...');
  const app = await NestFactory.create(AppModule);

  // Use native WebSocket adapter (not Socket.IO)
  app.useWebSocketAdapter(new WsAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('JA Core API')
    .setDescription('JA Backend Core Microservice API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);



  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      '*',
      // Allow file:// protocol for local testing (only in development)
      ...(process.env.NODE_ENV !== 'production' ? ['null'] : []),
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.use(cookieParser());

  app.use(compression());

  app.use(
    helmet({
      xssFilter: true,
      hidePoweredBy: true,
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null
        }
      }
    }),
  );

  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API Gateway is running on: http://localhost:${port}`);
  Logger.log(`WebSocket endpoint: ws://localhost:${port}/ws/notifications`);
}
bootstrap();

