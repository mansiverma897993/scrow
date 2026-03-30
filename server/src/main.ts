import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Raw bodies for payment webhooks (Stripe/Razorpay require exact payload).
  app.use('/webhooks/stripe', bodyParser.raw({ type: '*/*' }));
  app.use('/webhooks/razorpay', bodyParser.raw({ type: '*/*' }));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-scrow-api-key'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Scrow server listening on http://localhost:${port}`);
}

bootstrap();

