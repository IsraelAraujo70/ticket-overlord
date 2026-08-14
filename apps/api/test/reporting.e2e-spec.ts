import { createHash, randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { POSTGRES_POOL } from '../src/database/database.constants';
import { configureOpenApi } from '../src/openapi';
import type {
  ReportEventPage,
  ReportOverview,
} from '../src/reporting/domain/reporting.types';

interface UserSession {
  userId: string;
  token: string;
}

describe('Administrative reporting API (e2e)', () => {
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
      'TRUNCATE tickets, ticket_signing_keys, payments, reservations, events, auth_sessions, auth_tokens, organization_members, organizations, users RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents period-filtered overview and event report contracts', async () => {
    await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown).toMatchObject({
          paths: {
            '/reports/overview': {
              get: {
                security: [{ bearer: [] }],
                responses: { 200: {}, 401: {}, 403: {} },
              },
            },
            '/reports/events': {
              get: {
                security: [{ bearer: [] }],
                responses: { 200: {}, 401: {}, 403: {} },
              },
            },
          },
          components: {
            schemas: {
              ReportOverview: {
                properties: {
                  period: { enum: ['7d', '30d', '90d', 'all'] },
                  totals: { $ref: '#/components/schemas/ReportTotals' },
                },
              },
            },
          },
        });
      });
  });

  it('filters activity by period and isolates organizers from other organizations', async () => {
    const fixture = await createFixture(pool);

    await request(app.getHttpServer())
      .get('/reports/overview?period=30d')
      .set('Authorization', `Bearer ${fixture.organizer.token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as ReportOverview;
        expect(body).toMatchObject({
          scope: 'ORGANIZATION',
          period: '30d',
          totals: {
            purchases: 1,
            ticketsSold: 2,
            grossRevenueInCents: 5000,
            checkIns: 1,
          },
        });
        expect(body.upcomingEvents).toHaveLength(1);
        expect(body.upcomingEvents[0]).toMatchObject({
          id: fixture.eventId,
          organizationName: 'First Organization',
          ticketsSoldAllTime: 3,
          checkInsAllTime: 1,
          occupancyPercentage: 15,
        });
      });

    await request(app.getHttpServer())
      .get('/reports/overview?period=all')
      .set('Authorization', `Bearer ${fixture.organizer.token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as ReportOverview;
        expect(body.totals).toEqual({
          purchases: 2,
          ticketsSold: 3,
          grossRevenueInCents: 7500,
          checkIns: 1,
        });
      });

    await request(app.getHttpServer())
      .get('/reports/events?period=30d&page=1&pageSize=20')
      .set('Authorization', `Bearer ${fixture.organizer.token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as ReportEventPage;
        expect(body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
        expect(body.items[0]).toMatchObject({
          id: fixture.eventId,
          purchases: 1,
          ticketsSold: 2,
          ticketsSoldAllTime: 3,
          availableQuantity: 17,
        });
      });
  });

  it('gives admins a global view and denies gate staff', async () => {
    const fixture = await createFixture(pool);

    await request(app.getHttpServer())
      .get('/reports/overview?period=30d')
      .set('Authorization', `Bearer ${fixture.admin.token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as ReportOverview;
        expect(body).toMatchObject({
          scope: 'GLOBAL',
          totals: {
            purchases: 2,
            ticketsSold: 5,
            grossRevenueInCents: 12500,
            checkIns: 1,
          },
        });
        expect(body.upcomingEvents).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .get('/reports/events?period=30d&search=Second')
      .set('Authorization', `Bearer ${fixture.admin.token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as ReportEventPage;
        expect(body.total).toBe(1);
        expect(body.items[0]).toMatchObject({
          organizationName: 'Second Organization',
          ticketsSold: 3,
        });
      });

    await request(app.getHttpServer())
      .get('/reports/overview')
      .set('Authorization', `Bearer ${fixture.staff.token}`)
      .expect(403)
      .expect({
        code: 'REPORTING_ACCESS_DENIED',
        message: 'Conta sem acesso aos relatórios administrativos.',
      });
    await request(app.getHttpServer())
      .get('/reports/overview?period=365d')
      .set('Authorization', `Bearer ${fixture.admin.token}`)
      .expect(400);
  });
});

async function createFixture(pool: Pool) {
  const organizationId = await createOrganization(
    pool,
    'First Organization',
    '11222333000181',
  );
  const otherOrganizationId = await createOrganization(
    pool,
    'Second Organization',
    '22333444000181',
  );
  const organizer = await createUserSession(pool, 'ORGANIZER', 'organizer');
  const staff = await createUserSession(pool, 'ORGANIZER_STAFF', 'staff');
  const admin = await createUserSession(pool, 'ADMIN', 'admin');
  const customer = await createUserSession(pool, 'CUSTOMER', 'customer');
  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1,$2,'OWNER'),($1,$3,'STAFF')`,
    [organizationId, organizer.userId, staff.userId],
  );
  const eventId = await createEvent(pool, organizationId, 'First Event');
  const otherEventId = await createEvent(
    pool,
    otherOrganizationId,
    'Second Event',
  );
  const signingKeyId = await createSigningKey(pool);
  await createPurchase(pool, {
    eventId,
    customerId: customer.userId,
    signingKeyId,
    quantity: 2,
    age: '1 day',
    usedTickets: 1,
  });
  await createPurchase(pool, {
    eventId,
    customerId: customer.userId,
    signingKeyId,
    quantity: 1,
    age: '40 days',
    usedTickets: 0,
  });
  await createPurchase(pool, {
    eventId: otherEventId,
    customerId: customer.userId,
    signingKeyId,
    quantity: 3,
    age: '1 day',
    usedTickets: 0,
  });
  return { eventId, organizer, staff, admin };
}

async function createOrganization(
  pool: Pool,
  name: string,
  cnpj: string,
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, cnpj, phone, postal_code, street, number, neighborhood, city, state)
     VALUES ($1,$2,'+5511999999999','01001000','Main Street','1','Center','Sao Paulo','SP') RETURNING id`,
    [name, cnpj],
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
       organization_id, slug, title, summary, category, starts_at, venue, city,
       capacity, price_in_cents, currency, cover_object_key, cover_content_type, status
     ) VALUES ($1,$2,$3,'Summary','Cinema',now() + interval '10 days','Main Venue','Sao Paulo',20,2500,'BRL','events/test.png','image/png','PUBLISHED') RETURNING id`,
    [
      organizationId,
      `${title.toLowerCase().replaceAll(' ', '-')}-${randomUUID()}`,
      title,
    ],
  );
  return required(result.rows[0]).id;
}

async function createSigningKey(pool: Pool): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO ticket_signing_keys (public_key_pem, private_key_pem)
     VALUES ('public-test-key', 'private-test-key') RETURNING id`,
  );
  return required(result.rows[0]).id;
}

async function createPurchase(
  pool: Pool,
  input: {
    eventId: string;
    customerId: string;
    signingKeyId: string;
    quantity: number;
    age: '1 day' | '40 days';
    usedTickets: number;
  },
): Promise<void> {
  const reservationId = randomUUID();
  await pool.query(
    `INSERT INTO reservations (
       id, event_id, customer_id, quantity, unit_price_in_cents, total_in_cents,
       currency, status, expires_at, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,2500,$5,'BRL','PAID',now() + interval '1 hour',now() - $6::interval,now() - $6::interval)`,
    [
      reservationId,
      input.eventId,
      input.customerId,
      input.quantity,
      input.quantity * 2500,
      input.age,
    ],
  );
  await pool.query(
    `INSERT INTO payments (
       reservation_id, customer_id, amount_in_cents, currency, status,
       idempotency_key, created_at, processed_at
     ) VALUES ($1,$2,$3,'BRL','APPROVED',$4,now() - $5::interval,now() - $5::interval)`,
    [
      reservationId,
      input.customerId,
      input.quantity * 2500,
      randomUUID(),
      input.age,
    ],
  );
  for (let sequence = 1; sequence <= input.quantity; sequence += 1) {
    const ticketId = randomUUID();
    const used = sequence <= input.usedTickets;
    await pool.query(
      `INSERT INTO tickets (
         id, reservation_id, event_id, customer_id, sequence, manual_code,
         manual_code_hash, share_token_hash, signing_key_id, qr_code, status,
         used_at, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now() - $13::interval,now() - $13::interval)`,
      [
        ticketId,
        reservationId,
        input.eventId,
        input.customerId,
        sequence,
        `CODE-${ticketId.replaceAll('-', '').slice(0, 16)}`,
        sha256(`manual-${ticketId}`),
        sha256(`share-${ticketId}`),
        input.signingKeyId,
        `to1.${input.signingKeyId}.${ticketId}`,
        used ? 'USED' : 'VALID',
        used ? new Date() : null,
        input.age,
      ],
    );
  }
}

async function createUserSession(
  pool: Pool,
  role: 'CUSTOMER' | 'ORGANIZER' | 'ORGANIZER_STAFF' | 'ADMIN',
  prefix: string,
): Promise<UserSession> {
  const user = await pool.query<{ id: string }>(
    `INSERT INTO users (full_name, email, password_hash, role, email_verified_at)
     VALUES ($1,$2,'unused',$3,now()) RETURNING id`,
    [`${prefix} user`, `${prefix}-${randomUUID()}@example.com`, role],
  );
  const userId = required(user.rows[0]).id;
  const token = `${prefix}-${randomUUID()}`;
  await pool.query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1,$2,now() + interval '1 hour')`,
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
