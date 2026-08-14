import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { UserRole } from '../auth/domain/user-role';
import { ScryptPasswordHasher } from '../auth/infrastructure/security/scrypt-password-hasher';
import { PostgresTicketStore } from '../tickets/infrastructure/persistence/postgres-ticket-store';
import { events, organizationMembers, organizations, users } from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run the seed.');
}

const appEnvironment =
  process.env.APP_ENV ??
  (process.env.NODE_ENV === 'production' ? 'production' : 'local');
const isProduction = appEnvironment === 'production';
if (isProduction && process.env.ALLOW_PRODUCTION_DEMO_SEED !== 'true') {
  throw new Error(
    'ALLOW_PRODUCTION_DEMO_SEED=true is required to seed production.',
  );
}
const demoPassword =
  process.env.DEMO_PASSWORD ??
  (isProduction ? undefined : 'TicketOverlord2026!');
if (!demoPassword) {
  throw new Error('DEMO_PASSWORD is required to seed production.');
}
const seedPassword = demoPassword;
const requestedEventCount = Number(process.env.SEED_EVENT_COUNT ?? '9000');
if (
  !Number.isSafeInteger(requestedEventCount) ||
  requestedEventCount < 4 ||
  requestedEventCount > 50_000
) {
  throw new Error('SEED_EVENT_COUNT must be an integer between 4 and 50000.');
}
const seedEventCount = requestedEventCount;
const seedOrganizationCount = 30;
const pool = new Pool({ connectionString });
const database = drizzle(pool);
const passwordHasher = new ScryptPasswordHasher();
const s3Bucket = process.env.S3_BUCKET ?? 'ticket-overlord-events';
const s3Endpoint =
  process.env.S3_ENDPOINT_URL ??
  (isProduction ? undefined : 'http://localhost:9000');
const s3AccessKeyId =
  process.env.S3_ACCESS_KEY_ID ??
  (isProduction ? undefined : 'ticket_overlord');
const s3SecretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY ??
  (isProduction ? undefined : 'ticket_overlord_secret');
const s3Credentials =
  s3AccessKeyId && s3SecretAccessKey
    ? { accessKeyId: s3AccessKeyId, secretAccessKey: s3SecretAccessKey }
    : undefined;
const s3Client = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  forcePathStyle:
    (process.env.S3_FORCE_PATH_STYLE ?? (isProduction ? 'false' : 'true')) ===
    'true',
  ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
  ...(s3Credentials ? { credentials: s3Credentials } : {}),
});

const saoPauloDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

function todayAt(time: string): Date {
  return new Date(`${saoPauloDate}T${time}:00-03:00`);
}

interface SeedEvent {
  id: string;
  externalSource: 'TMDB' | null;
  externalId: string | null;
  category: string;
  slug: string;
  title: string;
  summary: string;
  sourceReleaseDate: string | null;
  startsAt: Date;
  venue: string;
  city: string;
  capacity: number;
  priceInCents: number;
  image: string;
}

const demoEvents: SeedEvent[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    externalSource: 'TMDB',
    externalId: '598',
    category: 'Cinema',
    slug: 'cidade-de-deus-no-bel-as-artes',
    title: 'Cidade de Deus',
    summary:
      'Uma sessão especial do marco do cinema brasileiro, seguida de conversa sobre direção e montagem.',
    sourceReleaseDate: '2002-08-30',
    startsAt: todayAt('19:00'),
    venue: 'Cine Belas Artes',
    city: 'São Paulo',
    capacity: 180,
    priceInCents: 4500,
    image: 'concert-hero.webp',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    externalSource: null,
    externalId: null,
    category: 'Shows e festivais',
    slug: 'o-auto-da-compadecida-sessao-aberta',
    title: 'Festival Overlord de Música',
    summary:
      'Uma noite de música brasileira ao vivo com artistas independentes e convidados.',
    sourceReleaseDate: null,
    startsAt: todayAt('18:30'),
    venue: 'Audio Club',
    city: 'São Paulo',
    capacity: 320,
    priceInCents: 3500,
    image: 'comedy.webp',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    externalSource: null,
    externalId: null,
    category: 'Teatro',
    slug: 'bacurau-debate-e-cinema',
    title: 'Entre Atos',
    summary:
      'Espetáculo contemporâneo sobre encontros, memória e as histórias que contamos no palco.',
    sourceReleaseDate: null,
    startsAt: todayAt('20:00'),
    venue: 'Teatro Guaíra',
    city: 'Curitiba',
    capacity: 140,
    priceInCents: 4200,
    image: 'theatre.webp',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    externalSource: null,
    externalId: null,
    category: 'Gastronomia',
    slug: 'central-do-brasil-restaurado',
    title: 'Sabores do Brasil',
    summary:
      'Festival gastronômico com cozinhas regionais, produtores locais e música ao vivo.',
    sourceReleaseDate: null,
    startsAt: todayAt('20:30'),
    venue: 'Marina da Glória',
    city: 'Rio de Janeiro',
    capacity: 210,
    priceInCents: 4800,
    image: 'gastronomy.webp',
  },
];

const generatedTemplates = [
  {
    category: 'Shows e festivais',
    title: 'Festival Sonora',
    image: 'concert-hero.webp',
  },
  { category: 'Teatro', title: 'Entre Atos', image: 'theatre.webp' },
  {
    category: 'Gastronomia',
    title: 'Sabores da Cidade',
    image: 'gastronomy.webp',
  },
  {
    category: 'Conferências',
    title: 'Tech Futures',
    image: 'concert-hero.webp',
  },
  {
    category: 'Esportes',
    title: 'Arena em Movimento',
    image: 'concert-hero.webp',
  },
  { category: 'Comédia', title: 'Noite de Risadas', image: 'comedy.webp' },
] as const;

const cities = [
  ['São Paulo', 'Centro de Convenções'],
  ['Rio de Janeiro', 'Marina da Glória'],
  ['Curitiba', 'Teatro Guaíra'],
  ['Belo Horizonte', 'Palácio das Artes'],
  ['Porto Alegre', 'Auditório Araújo Vianna'],
  ['Salvador', 'Concha Acústica'],
  ['Recife', 'Classic Hall'],
  ['Brasília', 'Centro Internacional de Convenções'],
] as const;

const demoPurchases = [
  {
    reservationId: '20000000-0000-4000-8000-000000000001',
    paymentId: '30000000-0000-4000-8000-000000000001',
    paymentKey: '40000000-0000-4000-8000-000000000001',
  },
  {
    reservationId: '20000000-0000-4000-8000-000000000002',
    paymentId: '30000000-0000-4000-8000-000000000002',
    paymentKey: '40000000-0000-4000-8000-000000000002',
  },
  {
    reservationId: '20000000-0000-4000-8000-000000000003',
    paymentId: '30000000-0000-4000-8000-000000000003',
    paymentKey: '40000000-0000-4000-8000-000000000003',
  },
  {
    reservationId: '20000000-0000-4000-8000-000000000004',
    paymentId: '30000000-0000-4000-8000-000000000004',
    paymentKey: '40000000-0000-4000-8000-000000000004',
  },
] as const;

async function upsertUser(
  input: {
    fullName: string;
    email: string;
    role: UserRole;
  },
  passwordHash: string,
): Promise<string> {
  const email = input.email.toLowerCase();
  const [existing] = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const now = new Date();

  if (existing) {
    await database
      .update(users)
      .set({
        fullName: input.fullName,
        role: input.role,
        passwordHash,
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id));
    return existing.id;
  }

  const [created] = await database
    .insert(users)
    .values({
      ...input,
      email,
      passwordHash,
      emailVerifiedAt: now,
    })
    .returning({ id: users.id });

  if (!created) {
    throw new Error(`Could not seed user ${email}.`);
  }

  return created.id;
}

async function upsertOrganization(input: {
  name: string;
  cnpj: string;
  city: string;
  state: string;
}): Promise<string> {
  const [existing] = await database
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.cnpj, input.cnpj))
    .limit(1);
  const values = {
    name: input.name,
    cnpj: input.cnpj,
    phone: '+5511999999999',
    postalCode: '01001000',
    street: 'Praça dos Eventos',
    number: '100',
    complement: null,
    neighborhood: 'Centro',
    city: input.city,
    state: input.state,
  };

  if (existing) {
    await database
      .update(organizations)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(organizations.id, existing.id));
    return existing.id;
  }

  const [created] = await database
    .insert(organizations)
    .values(values)
    .returning({ id: organizations.id });
  if (!created) throw new Error(`Could not seed organization ${input.cnpj}.`);
  return created.id;
}

function deterministicCnpj(index: number): string {
  const root = `${70_000_000 + index}`.padStart(8, '0') + '0001';
  const first = cnpjDigit(root, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjDigit(
    `${root}${first}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return `${root}${first}${second}`;
}

function cnpjDigit(value: string, weights: number[]): number {
  const sum = [...value].reduce(
    (total, digit, index) => total + Number(digit) * (weights[index] ?? 0),
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function generatedEvent(index: number): SeedEvent {
  const template = generatedTemplates[index % generatedTemplates.length];
  const [city, venue] = cities[index % cities.length];
  const sequence = index + 1;
  const startsAt = new Date(
    Date.now() +
      (1 + (index % 365)) * 24 * 60 * 60 * 1000 +
      (index % 12) * 60 * 60 * 1000,
  );
  return {
    id: `50000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    externalSource: null,
    externalId: null,
    category: template.category,
    slug: `seed-${template.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sequence}`,
    title: `${template.title} ${sequence}`,
    summary: `${template.title} reúne experiências de ${template.category.toLowerCase()} em ${city}.`,
    sourceReleaseDate: null,
    startsAt,
    venue,
    city,
    capacity: 100 + (index % 901),
    priceInCents: 2000 + (index % 80) * 100,
    image: template.image,
  };
}

async function run(): Promise<void> {
  const passwordHash = await passwordHasher.hash(seedPassword);
  const adminId = await upsertUser(
    {
      fullName: 'Administrador Ticket Overlord',
      email: 'admin@ticketoverlord.local',
      role: 'ADMIN',
    },
    passwordHash,
  );
  const organizerId = await upsertUser(
    {
      fullName: 'Olívia Organizadora',
      email: 'organizer@ticketoverlord.local',
      role: 'ORGANIZER',
    },
    passwordHash,
  );
  const customerOneId = await upsertUser(
    {
      fullName: 'Carlos Comprador',
      email: 'customer.one@ticketoverlord.local',
      role: 'CUSTOMER',
    },
    passwordHash,
  );
  const customerTwoId = await upsertUser(
    {
      fullName: 'Camila Compradora',
      email: 'customer.two@ticketoverlord.local',
      role: 'CUSTOMER',
    },
    passwordHash,
  );
  const staffId = await upsertUser(
    {
      fullName: 'Gabriel Portaria',
      email: 'gate@ticketoverlord.local',
      role: 'ORGANIZER_STAFF',
    },
    passwordHash,
  );

  const organizationIds: string[] = [];
  for (let index = 0; index < seedOrganizationCount; index += 1) {
    const organizationId = await upsertOrganization({
      name: index === 0 ? 'Aurora Eventos' : `Produtora Overlord ${index + 1}`,
      cnpj: index === 0 ? '11222333000181' : deterministicCnpj(index),
      city: cities[index % cities.length][0],
      state: index % 2 === 0 ? 'SP' : 'RJ',
    });
    organizationIds.push(organizationId);

    const ownerId =
      index === 0
        ? organizerId
        : await upsertUser(
            {
              fullName: `Organizador Demo ${index + 1}`,
              email: `organizer.${index + 1}@ticketoverlord.local`,
              role: 'ORGANIZER',
            },
            passwordHash,
          );
    await database
      .insert(organizationMembers)
      .values({ organizationId, userId: ownerId, role: 'OWNER' })
      .onConflictDoNothing();
  }

  const organizationId = organizationIds[0];
  if (!organizationId) throw new Error('Could not seed organizations.');

  await database
    .insert(organizationMembers)
    .values([{ organizationId, userId: staffId, role: 'STAFF' }])
    .onConflictDoNothing();

  const seedEvents = [
    ...demoEvents,
    ...Array.from({ length: seedEventCount - demoEvents.length }, (_, index) =>
      generatedEvent(index),
    ),
  ];
  const imageNames = [...new Set(seedEvents.map((event) => event.image))];
  for (const image of imageNames) {
    const cover = await readFile(
      resolve(process.cwd(), '../web/public/images/events', image),
    );
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: `seed/covers/${image}`,
        Body: cover,
        ContentLength: cover.length,
        ContentType: 'image/webp',
      }),
    );
  }

  for (let offset = 0; offset < seedEvents.length; offset += 250) {
    const batch = seedEvents
      .slice(offset, offset + 250)
      .map((event, index) => ({
        id: event.id,
        organizationId:
          organizationIds[(offset + index) % organizationIds.length],
        externalSource: event.externalSource,
        externalId: event.externalId,
        slug: event.slug,
        title: event.title,
        summary: event.summary,
        category: event.category,
        sourceReleaseDate: event.sourceReleaseDate,
        sourceImageUrl: null,
        startsAt: event.startsAt,
        venue: event.venue,
        city: event.city,
        capacity: event.capacity,
        priceInCents: event.priceInCents,
        currency: 'BRL' as const,
        coverObjectKey: `seed/covers/${event.image}`,
        coverContentType: 'image/webp',
        status: 'PUBLISHED' as const,
      }));
    await database
      .insert(events)
      .values(batch)
      .onConflictDoUpdate({
        target: events.slug,
        set: {
          organizationId: sql`excluded.organization_id`,
          externalSource: sql`excluded.external_source`,
          externalId: sql`excluded.external_id`,
          title: sql`excluded.title`,
          summary: sql`excluded.summary`,
          category: sql`excluded.category`,
          sourceReleaseDate: sql`excluded.source_release_date`,
          startsAt: sql`excluded.starts_at`,
          venue: sql`excluded.venue`,
          city: sql`excluded.city`,
          capacity: sql`excluded.capacity`,
          priceInCents: sql`excluded.price_in_cents`,
          coverObjectKey: sql`excluded.cover_object_key`,
          coverContentType: sql`excluded.cover_content_type`,
          status: sql`excluded.status`,
          updatedAt: new Date(),
        },
      });
  }

  for (const event of demoEvents) {
    await database
      .update(events)
      .set({
        organizationId,
        externalSource: event.externalSource,
        externalId: event.externalId,
        title: event.title,
        summary: event.summary,
        category: event.category,
        sourceReleaseDate: event.sourceReleaseDate,
        startsAt: event.startsAt,
        venue: event.venue,
        city: event.city,
        capacity: event.capacity,
        priceInCents: event.priceInCents,
        coverObjectKey: `seed/covers/${event.image}`,
        status: 'PUBLISHED',
        updatedAt: new Date(),
      })
      .where(eq(events.slug, event.slug));
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ticketStore = new PostgresTicketStore(pool);
    for (const [index, event] of demoEvents.entries()) {
      const purchase = demoPurchases[index];
      if (!purchase) throw new Error(`Missing demo purchase for ${event.id}.`);

      await client.query(
        `INSERT INTO reservations (
           id, event_id, customer_id, quantity, unit_price_in_cents,
           total_in_cents, currency, status, expires_at
         ) VALUES ($1,$2,$3,2,$4,$5,'BRL','PAID',$6)
         ON CONFLICT (id) DO UPDATE SET
           event_id = EXCLUDED.event_id,
           customer_id = EXCLUDED.customer_id,
           quantity = EXCLUDED.quantity,
           unit_price_in_cents = EXCLUDED.unit_price_in_cents,
           total_in_cents = EXCLUDED.total_in_cents,
           status = EXCLUDED.status,
           expires_at = EXCLUDED.expires_at,
           updated_at = now()`,
        [
          purchase.reservationId,
          event.id,
          customerOneId,
          event.priceInCents,
          event.priceInCents * 2,
          event.startsAt,
        ],
      );
      await client.query(
        `INSERT INTO payments (
           id, reservation_id, customer_id, amount_in_cents, currency,
           status, idempotency_key
         ) VALUES ($1,$2,$3,$4,'BRL','APPROVED',$5)
         ON CONFLICT (reservation_id) DO UPDATE SET
           customer_id = EXCLUDED.customer_id,
           amount_in_cents = EXCLUDED.amount_in_cents,
           status = EXCLUDED.status`,
        [
          purchase.paymentId,
          purchase.reservationId,
          customerOneId,
          event.priceInCents * 2,
          purchase.paymentKey,
        ],
      );
      await ticketStore.issueForPaidReservation(client, {
        reservationId: purchase.reservationId,
        eventId: event.id,
        customerId: customerOneId,
        quantity: 2,
      });
      await client.query(
        `UPDATE tickets
         SET status = 'VALID', used_at = NULL, used_by_user_id = NULL, updated_at = now()
         WHERE reservation_id = $1`,
        [purchase.reservationId],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(
    `Seeded users ${[adminId, organizerId, customerOneId, customerTwoId, staffId].join(', ')}, ${organizationIds.length} organizations, ${seedEvents.length} published events, ${imageNames.length} shared covers, and ${demoEvents.length * 2} demo tickets.`,
  );
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
