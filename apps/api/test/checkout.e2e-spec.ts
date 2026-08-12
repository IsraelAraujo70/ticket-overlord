import { createHash, randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { POSTGRES_POOL } from '../src/database/database.constants';
import { configureOpenApi } from '../src/openapi';

interface Fixture {
  eventId: string;
  slug: string;
  customerToken: string;
  otherCustomerToken: string;
  organizerToken: string;
}

describe('Checkout API (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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
    await pool.query(
      'TRUNCATE payments, reservations, events, auth_sessions, auth_tokens, organization_members, organizations, users RESTART IDENTITY CASCADE',
    );
  });

  it('documents checkout paths, security, header, bodies and responses', async () => {
    await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown).toMatchObject({
          paths: {
            '/events/published/{slug}': {
              get: { responses: { 200: {}, 404: {} } },
            },
            '/reservations': {
              post: {
                security: [{ bearer: [] }],
                requestBody: { content: { 'application/json': {} } },
                responses: {
                  201: {},
                  400: {},
                  401: {},
                  403: {},
                  404: {},
                  409: {},
                },
              },
            },
            '/reservations/{reservationId}': {
              get: { security: [{ bearer: [] }] },
            },
            '/reservations/{reservationId}/payment': {
              post: {
                security: [{ bearer: [] }],
                parameters: [
                  expect.objectContaining({
                    in: 'path',
                    name: 'reservationId',
                  }),
                  expect.objectContaining({
                    in: 'header',
                    name: 'Idempotency-Key',
                    required: true,
                  }),
                ],
                requestBody: { content: { 'application/json': {} } },
                responses: {
                  200: {},
                  400: {},
                  401: {},
                  403: {},
                  404: {},
                  409: {},
                },
              },
            },
          },
          components: {
            schemas: {
              PublishedEventDetail: {
                properties: {
                  availableQuantity: { minimum: 0 },
                  maxQuantityPerReservation: { maximum: 10, minimum: 1 },
                },
              },
              ProcessPaymentDto: {
                properties: {
                  outcome: { enum: ['APPROVED', 'REFUSED'] },
                },
              },
            },
          },
        });
      });
  });

  it('serializes concurrent reservations and never exceeds capacity', async () => {
    const fixture = await createFixture(pool, 5);

    const responses = await Promise.all(
      [fixture.customerToken, fixture.otherCustomerToken].map((token) =>
        request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${token}`)
          .send({ eventId: fixture.eventId, quantity: 4 }),
      ),
    );
    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);

    const allocated = await pool.query<{ quantity: number }>(
      `SELECT COALESCE(SUM(quantity), 0)::integer AS quantity
       FROM reservations
       WHERE event_id = $1 AND status = 'PENDING_PAYMENT'`,
      [fixture.eventId],
    );
    expect(allocated.rows[0]?.quantity).toBe(4);
    await request(app.getHttpServer())
      .get(`/events/published/${fixture.slug}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: fixture.eventId,
          availableQuantity: 1,
          maxQuantityPerReservation: 10,
        });
        expect(body).not.toHaveProperty('organizationId');
      });
  });

  it('replays concurrent payments once and enforces ownership and roles', async () => {
    const fixture = await createFixture(pool, 3);
    const created = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${fixture.customerToken}`)
      .send({ eventId: fixture.eventId, quantity: 2 })
      .expect(201);
    const reservationId = (created.body as { id: string }).id;
    const idempotencyKey = randomUUID();

    const payments = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/reservations/${reservationId}/payment`)
          .set('Authorization', `Bearer ${fixture.customerToken}`)
          .set('Idempotency-Key', idempotencyKey)
          .send({ outcome: 'APPROVED' }),
      ),
    );
    expect(payments.map(({ status }) => status)).toEqual([200, 200]);
    expect(payments[0].body).toEqual(payments[1].body);
    expect(payments[0].body).toMatchObject({
      payment: { status: 'APPROVED', idempotencyKey },
      reservation: { status: 'PAID' },
    });

    const persisted = await pool.query<{ count: number }>(
      'SELECT count(*)::integer AS count FROM payments WHERE reservation_id = $1',
      [reservationId],
    );
    expect(persisted.rows[0]?.count).toBe(1);

    await request(app.getHttpServer())
      .get(`/events/published/${fixture.slug}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ availableQuantity: 1 });
      });
    await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/payment`)
      .set('Authorization', `Bearer ${fixture.customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ outcome: 'REFUSED' })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
      });
    await request(app.getHttpServer())
      .get(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${fixture.otherCustomerToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${fixture.organizerToken}`)
      .send({ eventId: fixture.eventId, quantity: 1 })
      .expect(403);
    await request(app.getHttpServer())
      .post('/reservations')
      .send({ eventId: fixture.eventId, quantity: 1 })
      .expect(401);
  });

  it('releases inventory immediately after refusal and logical expiration', async () => {
    const fixture = await createFixture(pool, 3);
    const refusedReservation = await createReservation(
      app,
      fixture.customerToken,
      fixture.eventId,
      3,
    );
    await request(app.getHttpServer())
      .post(`/reservations/${refusedReservation}/payment`)
      .set('Authorization', `Bearer ${fixture.customerToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ outcome: 'REFUSED' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          payment: { status: 'REFUSED' },
          reservation: { status: 'PAYMENT_REFUSED' },
        });
      });
    await expectAvailability(app, fixture.slug, 3);

    const expiredReservation = await createReservation(
      app,
      fixture.customerToken,
      fixture.eventId,
      3,
    );
    await pool.query(
      "UPDATE reservations SET expires_at = now() - interval '1 second' WHERE id = $1",
      [expiredReservation],
    );
    await expectAvailability(app, fixture.slug, 3);
    await request(app.getHttpServer())
      .get(`/reservations/${expiredReservation}`)
      .set('Authorization', `Bearer ${fixture.customerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ status: 'EXPIRED' });
        expect(body).not.toHaveProperty('customerId');
      });
    await request(app.getHttpServer())
      .post(`/reservations/${expiredReservation}/payment`)
      .set('Authorization', `Bearer ${fixture.customerToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ outcome: 'APPROVED' })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'RESERVATION_EXPIRED' });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});

async function createFixture(pool: Pool, capacity: number): Promise<Fixture> {
  const organization = await pool.query<{ id: string }>(
    `INSERT INTO organizations (
       name, cnpj, phone, postal_code, street, number,
       neighborhood, city, state
     ) VALUES ('Checkout Events', '11222333000181', '+5511999999999',
       '01001000', 'Main Street', '1', 'Center', 'Sao Paulo', 'SP')
     RETURNING id`,
  );
  const organizationId = required(organization.rows[0]).id;
  const customer = await createUserSession(pool, 'CUSTOMER', 'customer');
  const otherCustomer = await createUserSession(pool, 'CUSTOMER', 'other');
  const organizer = await createUserSession(pool, 'ORGANIZER', 'organizer');
  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'OWNER')`,
    [organizationId, organizer.userId],
  );
  const slug = `checkout-event-${randomUUID()}`;
  const event = await pool.query<{ id: string }>(
    `INSERT INTO events (
       organization_id, external_source, external_id, slug, title, summary,
       category, starts_at, venue, city, capacity, price_in_cents, currency,
       cover_object_key, cover_content_type, status
     ) VALUES ($1, 'TMDB', '157336', $2, 'Checkout Event', 'Summary',
       'Cinema', now() + interval '1 day', 'Main Venue', 'Sao Paulo', $3,
       2500, 'BRL', 'events/test/cover.png', 'image/png', 'PUBLISHED')
     RETURNING id`,
    [organizationId, slug, capacity],
  );
  return {
    eventId: required(event.rows[0]).id,
    slug,
    customerToken: customer.token,
    otherCustomerToken: otherCustomer.token,
    organizerToken: organizer.token,
  };
}

async function createUserSession(
  pool: Pool,
  role: 'CUSTOMER' | 'ORGANIZER',
  prefix: string,
): Promise<{ userId: string; token: string }> {
  const user = await pool.query<{ id: string }>(
    `INSERT INTO users (full_name, email, password_hash, role, email_verified_at)
     VALUES ($1, $2, 'unused', $3, now()) RETURNING id`,
    [`${prefix} user`, `${prefix}-${randomUUID()}@example.com`, role],
  );
  const userId = required(user.rows[0]).id;
  const token = `${prefix}-${randomUUID()}`;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await pool.query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '1 hour')`,
    [userId, tokenHash],
  );
  return { userId, token };
}

async function createReservation(
  app: INestApplication<App>,
  token: string,
  eventId: string,
  quantity: number,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ eventId, quantity })
    .expect(201);
  return (response.body as { id: string }).id;
}

async function expectAvailability(
  app: INestApplication<App>,
  slug: string,
  availableQuantity: number,
): Promise<void> {
  await request(app.getHttpServer())
    .get(`/events/published/${slug}`)
    .expect(200)
    .expect(({ body }) => {
      expect(body).toMatchObject({ availableQuantity });
    });
}

function required<T>(value: T | undefined): T {
  if (!value) throw new Error('Expected fixture row.');
  return value;
}
