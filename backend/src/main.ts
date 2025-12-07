// IMPORTANTE: Inicialização do OpenTelemetry DEVE ser feita ANTES de qualquer import
import { initTelemetry } from './telemetry';
initTelemetry();

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS configuration - secure multi-origin support
  const corsOrigins = configService
    .get('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((origin: string) => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'traceparent', // OpenTelemetry W3C Trace Context
      'tracestate', // OpenTelemetry W3C Trace Context
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global serializer interceptor (para @Exclude() funcionar)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('B3 Investment Analysis Platform API')
    .setDescription('API para plataforma de análise de investimentos B3 com IA')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação e autorização')
    .addTag('assets', 'Ativos da B3')
    .addTag('analysis', 'Análises de ativos')
    .addTag('portfolio', 'Gerenciamento de portfólio')
    .addTag('reports', 'Geração de relatórios')
    .addTag('scrapers', 'Scrapers de dados')
    .addTag('data-sources', 'Fontes de dados')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('APP_PORT', 3001);
  await app.listen(port);

  console.log(`
    🚀 Application is running on: http://localhost:${port}
    📚 API Documentation: http://localhost:${port}/api/docs
    🔥 Environment: ${configService.get('NODE_ENV')}
  `);
}

bootstrap();
