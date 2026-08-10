import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureOpenApi } from './openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  configureOpenApi(app);

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
