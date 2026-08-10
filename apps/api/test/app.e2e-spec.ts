import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureOpenApi } from './../src/openapi';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureOpenApi(app);
    await app.init();
  });

  it('/docs/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/docs/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect((response) => {
        expect(response.text).toContain('<title>Ticket Overlord API</title>');
        expect(response.text).toContain('<div id="swagger-ui"></div>');
      });
  });

  it('/docs/openapi.json (GET)', () => {
    return request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect((response) => {
        expect(response.body as unknown).toMatchObject({
          openapi: '3.1.0',
          info: {
            title: 'Ticket Overlord API',
            description:
              'Contrato HTTP dos endpoints implementados pela API do Ticket Overlord.',
            version: '0.1.0',
          },
          paths: {
            '/': {
              get: {
                operationId: 'getApiStatus',
                summary: 'Consultar o estado da API',
                tags: ['Status'],
                responses: {
                  200: {
                    description: 'API disponível.',
                    content: {
                      'application/json': {
                        schema: {
                          $ref: '#/components/schemas/ApiStatus',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              ApiStatus: {
                type: 'object',
                required: ['name', 'status'],
                properties: {
                  name: {
                    type: 'string',
                    enum: ['ticket-overlord-api'],
                    example: 'ticket-overlord-api',
                  },
                  status: {
                    type: 'string',
                    enum: ['ok'],
                    example: 'ok',
                  },
                },
              },
            },
          },
        });
      });
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ name: 'ticket-overlord-api', status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
