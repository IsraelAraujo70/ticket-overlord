import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureOpenApi } from './../src/openapi';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const documentedContract = JSON.parse(
    readFileSync(resolve(__dirname, '../../../docs/api/openapi.json'), 'utf8'),
  ) as unknown;

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
        expect(response.body as unknown).toEqual(documentedContract);
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
