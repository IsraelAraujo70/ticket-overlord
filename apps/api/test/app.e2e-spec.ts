import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AddressProvider } from '../src/address/application/ports/address-provider';
import { AddressLookupError } from '../src/address/domain/address';
import { AppModule } from '../src/app.module';
import {
  EMAIL_SENDER,
  type EmailSender,
  type TransactionalEmail,
} from '../src/auth/application/ports/email-sender';
import { STRONG_PASSWORD_PATTERN } from '../src/auth/domain/validation/password';
import { POSTGRES_POOL } from '../src/database/database.constants';
import { ExternalMovieCatalog } from '../src/events/application/ports/external-movie-catalog';
import type { ExternalMovie } from '../src/events/domain/event.types';
import { configureOpenApi } from '../src/openapi';

class InMemoryEmailSender implements EmailSender {
  confirmations: TransactionalEmail[] = [];
  passwordResets: TransactionalEmail[] = [];

  sendEmailConfirmation(message: TransactionalEmail): Promise<void> {
    this.confirmations.push(message);
    return Promise.resolve();
  }

  sendPasswordReset(message: TransactionalEmail): Promise<void> {
    this.passwordResets.push(message);
    return Promise.resolve();
  }

  clear(): void {
    this.confirmations = [];
    this.passwordResets = [];
  }
}

class FakeAddressProvider implements AddressProvider {
  lookup(postalCode: string) {
    if (postalCode === '88888888') {
      throw new AddressLookupError(
        'ADDRESS_PROVIDER_UNAVAILABLE',
        'Provider unavailable.',
      );
    }

    if (postalCode !== '01001000') {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      postalCode,
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    });
  }
}

class FakeMovieCatalog extends ExternalMovieCatalog {
  private readonly movie: ExternalMovie = {
    externalId: '157336',
    title: 'Interestelar',
    summary: 'Uma jornada para além das estrelas.',
    releaseDate: '2014-11-05',
    imageUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  };

  search(query: string): Promise<ExternalMovie[]> {
    return Promise.resolve(
      this.movie.title.toLowerCase().includes(query.toLowerCase())
        ? [this.movie]
        : [],
    );
  }

  findById(externalId: string): Promise<ExternalMovie | null> {
    return Promise.resolve(
      externalId === this.movie.externalId ? this.movie : null,
    );
  }
}

const customerRegistration = {
  accountType: 'customer',
  fullName: 'Maria Cliente',
  email: 'maria@example.com',
  password: 'StrongDemo2026!',
};

describe('Ticket Overlord API (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  const emails = new InMemoryEmailSender();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useValue(emails)
      .overrideProvider(AddressProvider)
      .useClass(FakeAddressProvider)
      .overrideProvider(ExternalMovieCatalog)
      .useClass(FakeMovieCatalog)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    configureOpenApi(app);
    await app.init();
    pool = app.get<Pool>(POSTGRES_POOL);
  });

  beforeEach(async () => {
    emails.clear();
    await pool.query(
      'TRUNCATE events, auth_sessions, auth_tokens, organization_members, organizations, users RESTART IDENTITY CASCADE',
    );
  });

  it('serves Swagger and exposes the implemented contracts', async () => {
    await request(app.getHttpServer())
      .get('/docs/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect((response) => {
        expect(response.text).toContain('<title>Ticket Overlord API</title>');
      });

    await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect((response) => {
        expect(response.body as unknown).toMatchObject({
          openapi: '3.1.0',
          paths: {
            '/auth/register': {
              post: {
                operationId: 'register',
                responses: { 201: {}, 400: {}, 409: {} },
              },
            },
            '/auth/email/confirm': {
              post: {
                operationId: 'confirmEmail',
                responses: { 200: {}, 400: {} },
              },
            },
            '/auth/login': {
              post: {
                operationId: 'login',
                responses: { 200: {}, 401: {}, 403: {} },
              },
            },
            '/auth/me': {
              get: {
                operationId: 'me',
                security: [{ bearer: [] }],
              },
            },
            '/auth/logout': { post: { operationId: 'logout' } },
            '/auth/password/forgot': {
              post: { operationId: 'forgotPassword' },
            },
            '/auth/password/reset': {
              post: { operationId: 'resetPassword' },
            },
            '/addresses/cep/{cep}': { get: { operationId: 'lookup' } },
            '/external-catalog/movies': {
              get: {
                operationId: 'search',
                security: [{ bearer: [] }],
              },
            },
            '/events': {
              get: {
                operationId: 'forOrganizer',
                security: [{ bearer: [] }],
              },
              post: {
                operationId: 'create',
                security: [{ bearer: [] }],
                requestBody: {
                  content: { 'multipart/form-data': {} },
                },
              },
            },
            '/events/published': {
              get: { operationId: 'published' },
            },
            '/events/{eventId}/publish': {
              post: {
                operationId: 'publish',
                security: [{ bearer: [] }],
                responses: {
                  200: {},
                  400: {},
                  401: {},
                  403: {},
                  404: {},
                },
              },
            },
          },
          components: {
            schemas: {
              RegisterDto: {
                properties: {
                  password: { pattern: STRONG_PASSWORD_PATTERN.source },
                },
              },
              ResetPasswordDto: {
                properties: {
                  password: { pattern: STRONG_PASSWORD_PATTERN.source },
                },
              },
            },
            securitySchemes: {
              bearer: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'opaque-session',
              },
            },
          },
        });
      });
  });

  it('confirms email idempotently and creates only one session', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(customerRegistration)
      .expect(201)
      .expect({ status: 'EMAIL_CONFIRMATION_REQUIRED' });

    expect(emails.confirmations).toHaveLength(1);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: customerRegistration.email,
        password: customerRegistration.password,
      })
      .expect(403)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
      });

    const confirmationToken = emails.confirmations[0].token;
    const confirmation = await request(app.getHttpServer())
      .post('/auth/email/confirm')
      .send({ token: confirmationToken })
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          status: string;
          session: {
            accessToken: string;
            user: { email: string; role: string };
          };
        };
        expect(body).toMatchObject({
          status: 'CONFIRMED',
          session: {
            user: {
              email: customerRegistration.email,
              role: 'CUSTOMER',
            },
          },
        });
        expect(body.session.accessToken).toEqual(expect.any(String));
      });
    await request(app.getHttpServer())
      .post('/auth/email/confirm')
      .send({ token: confirmationToken })
      .expect(200)
      .expect({ status: 'ALREADY_CONFIRMED' });

    const sessions = await pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM auth_sessions',
    );
    expect(sessions.rows[0]?.count).toBe('1');

    await request(app.getHttpServer())
      .post('/auth/email/confirm')
      .send({ token: 'unknown-confirmation-token' })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' });
      });

    const accessToken = (
      confirmation.body as { session: { accessToken: string } }
    ).session.accessToken;

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          email: customerRegistration.email,
          role: 'CUSTOMER',
          organizationId: null,
        });
      });
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('returns a conflict instead of leaking a duplicate-email database error', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(customerRegistration)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...customerRegistration, fullName: 'Outra Pessoa' })
      .expect(409)
      .expect({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Já existe uma conta com este e-mail.',
      });

    expect(emails.confirmations).toHaveLength(1);
  });

  it('rejects passwords that do not meet the strong-password policy', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...customerRegistration, password: 'lowercase only password' })
      .expect(400)
      .expect((response) => {
        const body = response.body as { message: unknown };
        expect(body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining(
              'A senha deve ter entre 12 e 128 caracteres',
            ),
          ]),
        );
      });
  });

  it('creates organizer data transactionally and blocks public role injection', async () => {
    const organizer = {
      accountType: 'organizer',
      fullName: 'Olívia Organizadora',
      email: 'organizer@example.com',
      password: 'StrongDemo2026!',
      organization: {
        name: 'Aurora Eventos',
        cnpj: '12.ABC.345/01DE-35',
        phone: '+55 35 99742-1900',
        address: {
          postalCode: '01001-000',
          street: 'Praça da Sé',
          number: '100',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state: 'SP',
        },
      },
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(organizer)
      .expect(201);

    const result = await pool.query<{
      role: string;
      cnpj: string;
      phone: string;
      state: string;
      member_role: string;
    }>(
      `SELECT u.role, o.cnpj, o.phone, o.state, om.role AS member_role
       FROM users u
       JOIN organization_members om ON om.user_id = u.id
       JOIN organizations o ON o.id = om.organization_id
       WHERE u.email = $1`,
      [organizer.email],
    );
    expect(result.rows).toEqual([
      {
        role: 'ORGANIZER',
        cnpj: '12ABC34501DE35',
        phone: '+5535997421900',
        state: 'SP',
        member_role: 'OWNER',
      },
    ]);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...customerRegistration,
        email: 'admin@example.com',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('resets a password once, revokes sessions and does not enumerate emails', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(customerRegistration)
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/email/confirm')
      .send({ token: emails.confirmations[0].token })
      .expect(200);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: customerRegistration.email,
        password: customerRegistration.password,
      })
      .expect(200);
    const oldSession = (login.body as { accessToken: string }).accessToken;

    await request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: 'unknown@example.com' })
      .expect(204);
    await request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: customerRegistration.email })
      .expect(204);
    const supersededResetToken = emails.passwordResets[0].token;
    await request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: customerRegistration.email })
      .expect(204);
    expect(emails.passwordResets).toHaveLength(2);

    const resetToken = emails.passwordResets[1].token;
    const newPassword = 'DifferentDemo2026!';
    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token: resetToken, password: 'lowercase only password' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token: supersededResetToken, password: newPassword })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token: resetToken, password: newPassword })
      .expect(204);
    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token: resetToken, password: newPassword })
      .expect(400);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${oldSession}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerRegistration.email, password: newPassword })
      .expect(200);
  });

  it('maps CEP format, absence and provider availability separately', async () => {
    await request(app.getHttpServer()).get('/addresses/cep/123').expect(400);
    await request(app.getHttpServer())
      .get('/addresses/cep/99999999')
      .expect(404);
    await request(app.getHttpServer())
      .get('/addresses/cep/88888888')
      .expect(503);
    await request(app.getHttpServer())
      .get('/addresses/cep/01001000')
      .expect(200)
      .expect({
        postalCode: '01001000',
        street: 'Praça da Sé',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      });
  });

  it('creates a local draft from the external catalog and stores its cover in MinIO', async () => {
    const organizer = {
      accountType: 'organizer',
      fullName: 'Olívia Organizadora',
      email: 'events-organizer@example.com',
      password: 'StrongDemo2026!',
      organization: {
        name: 'Aurora Eventos',
        cnpj: '11222333000181',
        phone: '+5511999999999',
        address: {
          postalCode: '01001000',
          street: 'Praça da Sé',
          number: '100',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state: 'SP',
        },
      },
    };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(organizer)
      .expect(201);
    const confirmation = await request(app.getHttpServer())
      .post('/auth/email/confirm')
      .send({ token: emails.confirmations[0].token })
      .expect(200);
    const token = (confirmation.body as { session: { accessToken: string } })
      .session.accessToken;

    await request(app.getHttpServer())
      .get('/external-catalog/movies?query=inter')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect([
        {
          externalId: '157336',
          title: 'Interestelar',
          summary: 'Uma jornada para além das estrelas.',
          releaseDate: '2014-11-05',
          imageUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        },
      ]);

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .field('externalId', '157336')
      .field('startsAt', '2099-09-05T22:00:00.000Z')
      .field('venue', 'Cine Belas Artes')
      .field('city', 'São Paulo')
      .field('capacity', '150')
      .field('priceInCents', '4500')
      .attach('cover', png, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          externalSource: 'TMDB',
          externalId: '157336',
          title: 'Interestelar',
          status: 'DRAFT',
          capacity: 150,
          priceInCents: 4500,
          coverContentType: 'image/png',
        });
      });

    await request(app.getHttpServer())
      .get('/events')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
      });
    await request(app.getHttpServer())
      .get('/events/published')
      .expect(200)
      .expect([]);

    const eventId = (created.body as { id: string }).id;
    await request(app.getHttpServer())
      .get(`/events/published/${eventId}/cover`)
      .expect(404);
    const cover = await request(app.getHttpServer())
      .get(`/events/${eventId}/cover`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const storedImage = await fetch((cover.body as { url: string }).url);
    expect(storedImage.status).toBe(200);
    expect(storedImage.headers.get('content-type')).toBe('image/png');

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...organizer,
        email: 'other-organizer@example.com',
        organization: {
          ...organizer.organization,
          name: 'Outra Organização',
          cnpj: '12ABC34501DE35',
          phone: '+5511888888888',
        },
      })
      .expect(201);
    const otherConfirmation = await request(app.getHttpServer())
      .post('/auth/email/confirm')
      .send({ token: emails.confirmations[1].token })
      .expect(200);
    const otherToken = (
      otherConfirmation.body as { session: { accessToken: string } }
    ).session.accessToken;
    await request(app.getHttpServer())
      .get('/events')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200)
      .expect([]);
    await request(app.getHttpServer())
      .get(`/events/${eventId}/cover`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404)
      .expect({
        code: 'EVENT_NOT_FOUND',
        message: 'Evento não encontrado.',
      });
    await request(app.getHttpServer())
      .post(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404)
      .expect({
        code: 'EVENT_NOT_FOUND',
        message: 'Evento não encontrado.',
      });

    await request(app.getHttpServer())
      .post(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id: eventId, status: 'PUBLISHED' });
      });
    await request(app.getHttpServer())
      .post(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id: eventId, status: 'PUBLISHED' });
      });
    await request(app.getHttpServer())
      .get('/events/published')
      .expect(200)
      .expect((response) => {
        const body = response.body as Array<{ id: string; status: string }>;
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          id: eventId,
          status: 'PUBLISHED',
        });
      });
    await request(app.getHttpServer())
      .get(`/events/published/${eventId}/cover`)
      .expect(200);

    const result = await pool.query<{
      organization_id: string;
      status: string;
    }>('SELECT organization_id, status FROM events WHERE id = $1', [eventId]);
    expect(result.rows).toEqual([
      {
        organization_id: expect.any(String) as string,
        status: 'PUBLISHED',
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });
});
