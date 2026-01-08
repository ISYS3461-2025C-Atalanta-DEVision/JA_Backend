import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { Logger, ValidationPipe } from "@nestjs/common";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { WsAdapter } from "@nestjs/platform-ws";

async function bootstrap() {
  Logger.log("Starting API Gateway...");
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>("app_config.port");
  const host = configService.get<string>("app_config.host");

  // Use native WebSocket adapter (not Socket.IO)
  app.useWebSocketAdapter(new WsAdapter(app));

  const config = new DocumentBuilder()
    .setTitle("JA Core API")
    .setDescription("JA Backend Core Microservice API")
    .setVersion("1.0")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", name: "X-API-Key", in: "header" }, "api-key")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true, // reflects the requesting origin back
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  await app.listen(port, host);
  Logger.log(`API Gateway is running on: http://${host}:${port}`);
  Logger.log(`WebSocket endpoint: ws://${host}:${port}/ws/notifications`);
}

bootstrap();
