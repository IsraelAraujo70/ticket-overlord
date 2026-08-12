import { createHash, randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import { createClient, type RedisClientType } from 'redis';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { POSTGRES_POOL } from '../src/database/database.constants';
import { configureOpenApi } from '../src/openapi';

interface UserSession {
  userId: string;
  token: string;
}

interface Fixture {
  eventId: string;
  otherEventId: string;
  organizationId: string;
  customer: UserSession;
  otherCustomer: UserSession;
  organizer: UserSession;
  staff: UserSession;
  otherOrganizer: UserSession;
}

describe('Tickets and gate API (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  let redis: RedisClientType;

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
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  });

  beforeEach(async () => {
    await pool.query(
      'TRUNCATE tickets, ticket_signing_keys, payments, reservations, events, auth_sessions, auth_tokens, organization_members, organizations, users RESTART IDENTITY CASCADE',
    );
    await redis.flushDb();
  });

  it('documents ticket, sharing and gate contracts', async () => {
    await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown).toMatchObject({
          paths: {
            '/tickets': {
              get: {
                security: [{ bearer: [] }],
                responses: { 200: {}, 401: {}, 403: {} },
              },
            },
            '/tickets/{ticketId}': {
              get: {
                security: [{ bearer: [] }],
                responses: { 200: {}, 401: {}, 403: {}, 404: {} },
              },
            },
            '/shared-tickets/{token}': {
              get: { responses: { 200: {}, 404: {} } },
            },
            '/gate/events': {
              get: {
                security: [{ bearer: [] }],
                responses: { 200: {}, 401: {}, 403: {} },
              },
            },
            '/gate/events/{eventId}/validate': {
              post: {
                security: [{ bearer: [] }],
                requestBody: { content: { 'application/json': {} } },
                responses: { 200: {}, 401: {}, 403: {} },
              },
            },
          },
          components: {
            schemas: {
              GateValidation: {
                properties: {
                  result: {
                    enum: [
                      'VALID',
                      'INVALID',
                      'ALREADY_USED',
                      'WRONG_EVENT',
                      'OUTSIDE_ADMISSION_WINDOW',
                    ],
                  },
                },
              },
            },
          },
        });
      });
  });

  it('issues exactly the paid quantity once and enforces customer ownership', async () => {
    const fixture = await createFixture(pool);
    const reservationId = await pay(
      app,
      fixture.customer.token,
      fixture.eventId,
      3,
    );

    await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/payment`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .set('Idempotency-Key', paymentKeyByReservation.get(reservationId) ?? '')
      .send({ outcome: 'APPROVED' })
      .expect(200);

    const persisted = await pool.query<{ count: number; sequences: number[] }>(
      'SELECT count(*)::integer count, array_agg(sequence ORDER BY sequence) sequences FROM tickets WHERE reservation_id = $1',
      [reservationId],
    );
    expect(persisted.rows[0]).toEqual({ count: 3, sequences: [1, 2, 3] });
    const listed = await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .expect(200);
    const tickets = listed.body as unknown as Array<{
      id: string;
      eventId: string;
      status: string;
      event: { title: string };
    }>;
    expect(tickets).toHaveLength(3);
    expect(tickets[0]).toMatchObject({
      eventId: fixture.eventId,
      status: 'VALID',
      event: { title: 'Gate Event' },
    });
    const ticketId = required(tickets[0]).id;
    await request(app.getHttpServer())
      .get(`/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${fixture.otherCustomer.token}`)
      .expect(404);
    await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${fixture.organizer.token}`)
      .expect(403);
  });

  it('resolves a public share token only by its hash', async () => {
    const fixture = await createFixture(pool);
    await pay(app, fixture.customer.token, fixture.eventId, 1);
    const ticket = await firstTicket(pool, fixture.eventId);
    const listed = await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .expect(200);
    const shareToken = required(
      (listed.body as unknown as Array<{ shareToken: string }>)[0],
    ).shareToken;

    await request(app.getHttpServer())
      .get(`/shared-tickets/${shareToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: ticket.id,
          customerName: 'Customer User',
        });
        expect(body).not.toHaveProperty('customerId');
        expect(body).not.toHaveProperty('shareToken');
      });
    await request(app.getHttpServer())
      .get('/shared-tickets/invalid-secret')
      .expect(404);
    const storage = await pool.query<{ share_token_hash: string }>(
      'SELECT share_token_hash FROM tickets WHERE id = $1',
      [ticket.id],
    );
    expect(storage.rows[0]?.share_token_hash).toBe(sha256(shareToken));
    expect(JSON.stringify(storage.rows[0])).not.toContain(shareToken);
  });

  it('lists only organization events for organizer and staff', async () => {
    const fixture = await createFixture(pool);
    for (const session of [fixture.organizer, fixture.staff]) {
      await request(app.getHttpServer())
        .get('/gate/events')
        .set('Authorization', `Bearer ${session.token}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveLength(2);
          expect((body as Array<{ id: string }>).map(({ id }) => id)).toContain(
            fixture.eventId,
          );
        });
    }
    await request(app.getHttpServer())
      .get('/gate/events')
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/gate/events')
      .set('Authorization', `Bearer ${fixture.otherOrganizer.token}`)
      .expect(200)
      .expect([]);
  });

  it('validates signatures, event and admission date without leaking tickets to another org', async () => {
    const fixture = await createFixture(pool);
    await pay(app, fixture.customer.token, fixture.eventId, 1);
    const ticket = await firstTicket(pool, fixture.eventId);
    const validate = (token: string, eventId: string, code: string) =>
      request(app.getHttpServer())
        .post(`/gate/events/${eventId}/validate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ code });

    await validate(
      fixture.organizer.token,
      fixture.eventId,
      `${ticket.qr_code}x`,
    )
      .expect(200)
      .expect({ result: 'INVALID' });
    await validate(
      fixture.organizer.token,
      fixture.otherEventId,
      ticket.qr_code,
    )
      .expect(200)
      .expect({ result: 'WRONG_EVENT' });
    await validate(
      fixture.otherOrganizer.token,
      fixture.eventId,
      ticket.qr_code,
    )
      .expect(200)
      .expect({ result: 'INVALID' });
    await pool.query(
      "UPDATE events SET starts_at = now() + interval '1 day' WHERE id = $1",
      [fixture.eventId],
    );
    await validate(fixture.staff.token, fixture.eventId, ticket.manual_code)
      .expect(200)
      .expect({ result: 'OUTSIDE_ADMISSION_WINDOW' });
    const unchanged = await pool.query<{ status: string }>(
      'SELECT status FROM tickets WHERE id = $1',
      [ticket.id],
    );
    expect(unchanged.rows[0]?.status).toBe('VALID');
  });

  it('does not consume a ticket when its event is no longer published', async () => {
    const fixture = await createFixture(pool);
    await pay(app, fixture.customer.token, fixture.eventId, 1);
    const ticket = await firstTicket(pool, fixture.eventId);
    await pool.query("UPDATE events SET status = 'DRAFT' WHERE id = $1", [
      fixture.eventId,
    ]);

    await request(app.getHttpServer())
      .post(`/gate/events/${fixture.eventId}/validate`)
      .set('Authorization', `Bearer ${fixture.staff.token}`)
      .send({ code: ticket.qr_code })
      .expect(200)
      .expect({ result: 'INVALID' });

    const unchanged = await pool.query<{ status: string }>(
      'SELECT status FROM tickets WHERE id = $1',
      [ticket.id],
    );
    expect(unchanged.rows[0]?.status).toBe('VALID');
  });

  it('atomically admits a ticket once under concurrent validation', async () => {
    const fixture = await createFixture(pool);
    await pay(app, fixture.customer.token, fixture.eventId, 1);
    const ticket = await firstTicket(pool, fixture.eventId);
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app.getHttpServer())
          .post(`/gate/events/${fixture.eventId}/validate`)
          .set('Authorization', `Bearer ${fixture.staff.token}`)
          .send({ code: ticket.qr_code }),
      ),
    );
    const results = responses.map(
      ({ body }) => (body as { result: string }).result,
    );
    expect(results.filter((result) => result === 'VALID')).toHaveLength(1);
    expect(results.filter((result) => result === 'ALREADY_USED')).toHaveLength(
      7,
    );
    const used = await pool.query<{ used_by_user_id: string; used_at: Date }>(
      'SELECT used_by_user_id, used_at FROM tickets WHERE id = $1',
      [ticket.id],
    );
    expect(used.rows[0]?.used_by_user_id).toBe(fixture.staff.userId);
    expect(used.rows[0]?.used_at).toBeInstanceOf(Date);
  });

  afterAll(async () => {
    await redis.close();
    await app.close();
  });
});

const paymentKeyByReservation = new Map<string, string>();

async function pay(
  app: INestApplication<App>,
  token: string,
  eventId: string,
  quantity: number,
): Promise<string> {
  const created = await request(app.getHttpServer())
    .post('/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ eventId, quantity })
    .expect(201);
  const reservationId = (created.body as { id: string }).id;
  const key = randomUUID();
  paymentKeyByReservation.set(reservationId, key);
  await request(app.getHttpServer())
    .post(`/reservations/${reservationId}/payment`)
    .set('Authorization', `Bearer ${token}`)
    .set('Idempotency-Key', key)
    .send({ outcome: 'APPROVED' })
    .expect(200);
  return reservationId;
}

async function firstTicket(pool: Pool, eventId: string) {
  const result = await pool.query<{
    id: string;
    qr_code: string;
    manual_code: string;
  }>(
    'SELECT id, qr_code, manual_code FROM tickets WHERE event_id = $1 ORDER BY sequence LIMIT 1',
    [eventId],
  );
  const ticket = result.rows[0];
  if (!ticket) throw new Error('Expected ticket fixture.');
  return ticket;
}

async function createFixture(pool: Pool): Promise<Fixture> {
  const organizationId = await createOrganization(pool, '11222333000181');
  const otherOrganizationId = await createOrganization(pool, '22333444000181');
  const customer = await createUserSession(pool, 'CUSTOMER', 'customer');
  const otherCustomer = await createUserSession(
    pool,
    'CUSTOMER',
    'other-customer',
  );
  const organizer = await createUserSession(pool, 'ORGANIZER', 'organizer');
  const staff = await createUserSession(pool, 'ORGANIZER_STAFF', 'staff');
  const otherOrganizer = await createUserSession(
    pool,
    'ORGANIZER',
    'other-organizer',
  );
  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1,$2,'OWNER'),($1,$3,'STAFF'),($4,$5,'OWNER')`,
    [
      organizationId,
      organizer.userId,
      staff.userId,
      otherOrganizationId,
      otherOrganizer.userId,
    ],
  );
  const eventId = await createEvent(pool, organizationId, 'Gate Event');
  const otherEventId = await createEvent(
    pool,
    organizationId,
    'Other Gate Event',
  );
  return {
    eventId,
    otherEventId,
    organizationId,
    customer,
    otherCustomer,
    organizer,
    staff,
    otherOrganizer,
  };
}

async function createOrganization(pool: Pool, cnpj: string): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, cnpj, phone, postal_code, street, number, neighborhood, city, state)
     VALUES ('Gate Organization',$1,'+5511999999999','01001000','Main Street','1','Center','Sao Paulo','SP') RETURNING id`,
    [cnpj],
  );
  return required(result.rows[0]).id;
}

async function createEvent(
  pool: Pool,
  organizationId: string,
  title: string,
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO events (
      organization_id, external_source, external_id, slug, title, summary, category,
      starts_at, venue, city, capacity, price_in_cents, currency, cover_object_key,
      cover_content_type, status
    ) VALUES ($1,'TMDB','157336',$2,$3,'Summary','Cinema',now() + interval '1 hour','Main Venue','Sao Paulo',20,2500,'BRL','events/test.png','image/png','PUBLISHED') RETURNING id`,
    [
      organizationId,
      `${title.toLowerCase().replaceAll(' ', '-')}-${randomUUID()}`,
      title,
    ],
  );
  return required(result.rows[0]).id;
}

async function createUserSession(
  pool: Pool,
  role: 'CUSTOMER' | 'ORGANIZER' | 'ORGANIZER_STAFF',
  prefix: string,
): Promise<UserSession> {
  const user = await pool.query<{ id: string }>(
    `INSERT INTO users (full_name, email, password_hash, role, email_verified_at)
     VALUES ($1,$2,'unused',$3,now()) RETURNING id`,
    [
      prefix === 'customer' ? 'Customer User' : `${prefix} user`,
      `${prefix}-${randomUUID()}@example.com`,
      role,
    ],
  );
  const userId = required(user.rows[0]).id;
  const token = `${prefix}-${randomUUID()}`;
  await pool.query(
    "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1,$2,now() + interval '1 hour')",
    [userId, sha256(token)],
  );
  return { userId, token };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function required<T>(value: T | undefined): T {
  if (!value) throw new Error('Expected fixture row.');
  return value;
}
