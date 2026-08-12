import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const OPENAPI_JSON_PATH = '/docs/openapi.json';
export const SWAGGER_UI_PATH = '/docs';

export function configureOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setOpenAPIVersion('3.1.0')
    .setTitle('Ticket Overlord API')
    .setDescription(
      'Contrato HTTP dos endpoints implementados pela API do Ticket Overlord.',
    )
    .setVersion('0.1.0')
    .addServer('http://localhost:3001', 'Desenvolvimento local')
    .addTag('Status', 'Disponibilidade básica da API.')
    .addTag('Authentication', 'Cadastro, sessão e recuperação de conta.')
    .addTag('Addresses', 'Preenchimento de endereço por CEP.')
    .addTag('External catalog', 'Catálogo de filmes usado para criar eventos.')
    .addTag('Events', 'Eventos locais e suas capas.')
    .addTag('Checkout', 'Reservas e pagamentos simulados.')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'opaque-session' },
      'bearer',
    )
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    });

  SwaggerModule.setup(SWAGGER_UI_PATH, app, documentFactory, {
    customSiteTitle: 'Ticket Overlord API',
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    raw: ['json'],
  });
}
