import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { UserRole } from '../auth/domain/user-role';
import { ScryptPasswordHasher } from '../auth/infrastructure/security/scrypt-password-hasher';
import { events, organizationMembers, organizations, users } from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run the seed.');
}

const demoPassword = process.env.DEMO_PASSWORD ?? 'TicketOverlord2026!';
const pool = new Pool({ connectionString });
const database = drizzle(pool);
const passwordHasher = new ScryptPasswordHasher();
const s3Bucket = process.env.S3_BUCKET ?? 'ticket-overlord-events';
const isProduction = process.env.APP_ENV === 'production';
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

const demoEvents = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    externalId: '598',
    slug: 'cidade-de-deus-no-bel-as-artes',
    title: 'Cidade de Deus',
    summary:
      'Uma sessão especial do marco do cinema brasileiro, seguida de conversa sobre direção e montagem.',
    sourceReleaseDate: '2002-08-30',
    startsAt: new Date('2026-08-22T19:00:00-03:00'),
    venue: 'Cine Belas Artes',
    city: 'São Paulo',
    capacity: 180,
    priceInCents: 4500,
    image: 'concert-hero.webp',
  },
] as const;

const obsoleteDemoEventIds = [
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
] as const;

async function upsertUser(input: {
  fullName: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  const email = input.email.toLowerCase();
  const [existing] = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const passwordHash = await passwordHasher.hash(demoPassword);
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

async function run(): Promise<void> {
  const adminId = await upsertUser({
    fullName: 'Administrador Ticket Overlord',
    email: 'admin@ticketoverlord.local',
    role: 'ADMIN',
  });
  const organizerId = await upsertUser({
    fullName: 'Olívia Organizadora',
    email: 'organizer@ticketoverlord.local',
    role: 'ORGANIZER',
  });
  const customerOneId = await upsertUser({
    fullName: 'Carlos Comprador',
    email: 'customer.one@ticketoverlord.local',
    role: 'CUSTOMER',
  });
  const customerTwoId = await upsertUser({
    fullName: 'Camila Compradora',
    email: 'customer.two@ticketoverlord.local',
    role: 'CUSTOMER',
  });
  const staffId = await upsertUser({
    fullName: 'Gabriel Portaria',
    email: 'gate@ticketoverlord.local',
    role: 'ORGANIZER_STAFF',
  });

  const [existingOrganization] = await database
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.cnpj, '11222333000181'))
    .limit(1);

  let organizationId = existingOrganization?.id;

  if (organizationId) {
    await database
      .update(organizations)
      .set({
        name: 'Aurora Eventos',
        phone: '+5511999999999',
        postalCode: '01001000',
        street: 'Praça da Sé',
        number: '100',
        complement: null,
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));
  } else {
    const [createdOrganization] = await database
      .insert(organizations)
      .values({
        name: 'Aurora Eventos',
        cnpj: '11222333000181',
        phone: '+5511999999999',
        postalCode: '01001000',
        street: 'Praça da Sé',
        number: '100',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      })
      .returning({ id: organizations.id });
    organizationId = createdOrganization?.id;
  }

  if (!organizationId) {
    throw new Error('Could not seed organization.');
  }

  await database
    .insert(organizationMembers)
    .values([
      { organizationId, userId: organizerId, role: 'OWNER' },
      { organizationId, userId: staffId, role: 'STAFF' },
    ])
    .onConflictDoNothing();

  await database
    .delete(events)
    .where(inArray(events.id, [...obsoleteDemoEventIds]));

  for (const event of demoEvents) {
    const coverObjectKey = `organizations/${organizationId}/events/${event.id}/cover.webp`;
    const cover = await readFile(
      resolve(process.cwd(), '../web/public/images/events', event.image),
    );
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: coverObjectKey,
        Body: cover,
        ContentLength: cover.length,
        ContentType: 'image/webp',
      }),
    );
    await database
      .insert(events)
      .values({
        id: event.id,
        organizationId,
        externalSource: 'TMDB',
        externalId: event.externalId,
        slug: event.slug,
        title: event.title,
        summary: event.summary,
        category: 'Cinema',
        sourceReleaseDate: event.sourceReleaseDate,
        sourceImageUrl: null,
        startsAt: event.startsAt,
        venue: event.venue,
        city: event.city,
        capacity: event.capacity,
        priceInCents: event.priceInCents,
        currency: 'BRL',
        coverObjectKey,
        coverContentType: 'image/webp',
        status: 'PUBLISHED',
      })
      .onConflictDoUpdate({
        target: events.slug,
        set: {
          organizationId,
          externalSource: 'TMDB',
          externalId: event.externalId,
          title: event.title,
          summary: event.summary,
          category: 'Cinema',
          sourceReleaseDate: event.sourceReleaseDate,
          startsAt: event.startsAt,
          venue: event.venue,
          city: event.city,
          capacity: event.capacity,
          priceInCents: event.priceInCents,
          coverObjectKey,
          coverContentType: 'image/webp',
          status: 'PUBLISHED',
          updatedAt: new Date(),
        },
      });
  }

  console.log(
    `Seeded users ${[adminId, organizerId, customerOneId, customerTwoId, staffId].join(', ')}, organization ${organizationId}, and ${demoEvents.length} published events.`,
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
