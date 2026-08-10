import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { PasswordHasher } from '../auth/security/password-hasher';
import {
  organizationMembers,
  organizations,
  users,
  type UserRole,
} from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run the seed.');
}

const demoPassword = process.env.DEMO_PASSWORD ?? 'TicketOverlord2026!';
const pool = new Pool({ connectionString });
const database = drizzle(pool);
const passwordHasher = new PasswordHasher();

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
        phone: '11999999999',
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
        phone: '11999999999',
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

  console.log(
    `Seeded users ${[adminId, organizerId, customerOneId, customerTwoId, staffId].join(', ')} and organization ${organizationId}.`,
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
