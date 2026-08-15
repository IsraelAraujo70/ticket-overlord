import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { HOLD_POLICY } from '../../checkout.constants';
import {
  HoldMaintenanceStore,
  HoldReconciliationStore,
  InventoryAvailabilityStore,
  PaymentHoldStore,
  ReservationHoldStore,
  type EventInventorySnapshot,
  type ProcessingHold,
} from '../../application/ports/inventory-hold-store';
import { CheckoutError } from '../../domain/checkout.errors';
import type { HoldPolicy } from '../../domain/hold-policy';
import type { ReservationRecord } from '../../application/models/checkout.models';

const scriptNames = [
  'init',
  'create',
  'read',
  'process',
  'release',
  'confirm',
  'cleanup',
] as const;
type ScriptName = (typeof scriptNames)[number];

@Injectable()
export class RedisInventoryHoldStore
  implements
    InventoryAvailabilityStore,
    ReservationHoldStore,
    PaymentHoldStore,
    HoldReconciliationStore,
    HoldMaintenanceStore,
    OnModuleInit,
    OnApplicationShutdown
{
  private readonly logger = new Logger(RedisInventoryHoldStore.name);
  private readonly client: RedisClientType;
  private readonly scripts = new Map<
    ScriptName,
    { source: string; sha?: string }
  >();

  constructor(
    config: ConfigService,
    @Inject(HOLD_POLICY) private readonly policy: HoldPolicy,
  ) {
    this.client = createClient({
      url: config.getOrThrow<string>('REDIS_URL'),
      disableOfflineQueue: true,
      socket: { connectTimeout: 1_000, reconnectStrategy: false },
    });
    this.client.on('error', (error: Error) =>
      this.logger.error(`Redis client error: ${error.message}`),
    );
    for (const name of scriptNames) {
      this.scripts.set(name, {
        source: readFileSync(
          join(__dirname, 'scripts', `${name}-v1.lua`),
          'utf8',
        ),
      });
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      await Promise.all(scriptNames.map((name) => this.load(name)));
    } catch (error) {
      this.logger.error(
        `Redis startup connection failed: ${errorMessage(error)}`,
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.isOpen) await this.client.close();
  }

  async initialize(snapshot: EventInventorySnapshot): Promise<void> {
    const result = await this.run(
      'init',
      [
        inventoryKey(snapshot.eventId),
        expirationsKey(snapshot.eventId),
        'active-hold-events',
      ],
      [
        String(snapshot.capacity),
        String(snapshot.confirmedQuantity),
        String(Date.now()),
        snapshot.eventId,
      ],
    );
    if (result[0] !== 'OK') throw unavailable();
  }

  async available(snapshot: EventInventorySnapshot): Promise<number> {
    await this.initialize(snapshot);
    await this.run(
      'cleanup',
      [
        inventoryKey(snapshot.eventId),
        expirationsKey(snapshot.eventId),
        'active-hold-events',
      ],
      [String(Date.now()), snapshot.eventId],
    );
    return this.redis(async () => {
      const values = await this.client.hmGet(inventoryKey(snapshot.eventId), [
        'state',
        'capacity',
        'confirmed',
        'held',
      ]);
      const [state, capacityValue, confirmedValue, heldValue] = values;
      const capacity = Number(capacityValue);
      const confirmed = Number(confirmedValue);
      const held = Number(heldValue);
      if (
        state !== 'READY' ||
        capacity !== snapshot.capacity ||
        !Number.isSafeInteger(held) ||
        held < 0
      ) {
        await this.client.hSet(
          inventoryKey(snapshot.eventId),
          'state',
          'INITIALIZING',
        );
        throw unavailable();
      }
      return Math.max(
        capacity - Math.max(confirmed, snapshot.confirmedQuantity) - held,
        0,
      );
    });
  }

  async create(
    input: EventInventorySnapshot & { customerId: string; quantity: number },
  ): Promise<ReservationRecord> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + this.policy.durationMs;
    const result = await this.run(
      'create',
      [
        inventoryKey(input.eventId),
        expirationsKey(input.eventId),
        'active-hold-events',
        holdKey(input.eventId, id),
        ownerKey(id),
      ],
      [
        String(now),
        input.eventId,
        String(input.capacity),
        String(input.confirmedQuantity),
        id,
        String(input.quantity),
        input.customerId,
        String(input.priceInCents),
        input.currency,
        String(expiresAt),
      ],
    );
    if (result[0] === 'INSUFFICIENT')
      throw new CheckoutError(
        'INSUFFICIENT_INVENTORY',
        'A quantidade solicitada não está disponível.',
      );
    if (result[0] !== 'OK') throw unavailable();
    return {
      id,
      eventId: input.eventId,
      customerId: input.customerId,
      quantity: input.quantity,
      unitPriceInCents: input.priceInCents,
      totalInCents: input.priceInCents * input.quantity,
      currency: input.currency,
      status: 'PENDING_PAYMENT',
      expiresAt: new Date(expiresAt),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async find(
    reservationId: string,
    customerId: string,
  ): Promise<ReservationRecord | null> {
    const eventId = await this.redis(() =>
      this.client.get(ownerKey(reservationId)),
    );
    if (!eventId) return null;
    const result = await this.run(
      'read',
      [holdKey(eventId, reservationId)],
      [customerId, String(Date.now())],
    );
    if (result[0] === 'MISSING') return null;
    if (result[0] === 'EXPIRED')
      throw new CheckoutError(
        'RESERVATION_EXPIRED',
        'A reserva expirou e não pode ser paga.',
      );
    return holdRecord(hashResult(result));
  }

  async prepare(input: {
    reservationId: string;
    customerId: string;
    idempotencyKey: string;
    outcome: 'APPROVED' | 'REFUSED';
  }): Promise<ProcessingHold> {
    const eventId = await this.redis(() =>
      this.client.get(ownerKey(input.reservationId)),
    );
    if (!eventId)
      throw new CheckoutError(
        'RESERVATION_NOT_FOUND',
        'Reserva não encontrada.',
      );
    const result = await this.run(
      'process',
      [
        holdKey(eventId, input.reservationId),
        expirationsKey(eventId),
        'processing-holds',
      ],
      [
        input.customerId,
        String(Date.now()),
        input.idempotencyKey,
        input.outcome,
        input.reservationId,
        String(this.policy.processingTimeoutMs),
      ],
    );
    if (result[0] === 'MISSING')
      throw new CheckoutError(
        'RESERVATION_NOT_FOUND',
        'Reserva não encontrada.',
      );
    if (result[0] === 'EXPIRED')
      throw new CheckoutError(
        'RESERVATION_EXPIRED',
        'A reserva expirou e não pode ser paga.',
      );
    if (result[0] === 'CONFLICT')
      throw new CheckoutError(
        'IDEMPOTENCY_CONFLICT',
        'A chave de idempotência já foi usada com outros parâmetros.',
      );
    if (result[0] !== 'OK')
      throw new CheckoutError(
        'RESERVATION_NOT_PAYABLE',
        'A reserva não pode ser paga.',
      );
    const hash = hashResult(result);
    return {
      ...holdRecord(hash),
      idempotencyKey: required(hash.idempotencyKey),
      outcome: paymentOutcome(hash.outcome),
      fencingToken: integer(hash.fencingToken),
    };
  }

  async validate(hold: ProcessingHold): Promise<void> {
    const current = await this.redis(() =>
      this.client.hGetAll(holdKey(hold.eventId, hold.id)),
    );
    if (
      current.state !== 'PROCESSING' ||
      integer(current.fencingToken) !== hold.fencingToken ||
      current.idempotencyKey !== hold.idempotencyKey ||
      current.outcome !== hold.outcome
    )
      throw new CheckoutError(
        'RESERVATION_NOT_PAYABLE',
        'O processamento da reserva perdeu a posse do hold.',
      );
  }

  async release(hold: ProcessingHold): Promise<void> {
    await this.run(
      'release',
      [
        holdKey(hold.eventId, hold.id),
        inventoryKey(hold.eventId),
        expirationsKey(hold.eventId),
        'processing-holds',
        ownerKey(hold.id),
      ],
      [
        String(hold.fencingToken),
        hold.id,
        processingMember(hold),
        String(this.policy.durationMs),
      ],
    );
  }

  async confirm(
    hold: ProcessingHold,
    confirmedQuantity: number,
  ): Promise<void> {
    await this.run(
      'confirm',
      [
        holdKey(hold.eventId, hold.id),
        inventoryKey(hold.eventId),
        expirationsKey(hold.eventId),
        'processing-holds',
        ownerKey(hold.id),
      ],
      [
        String(hold.fencingToken),
        hold.id,
        processingMember(hold),
        String(confirmedQuantity),
      ],
    );
  }

  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const eventIds = await this.redis(() =>
      this.client.zRangeByScore('active-hold-events', 0, now),
    );
    await Promise.all(
      eventIds.map((eventId) =>
        this.run(
          'cleanup',
          [
            inventoryKey(eventId),
            expirationsKey(eventId),
            'active-hold-events',
          ],
          [String(now), eventId],
        ),
      ),
    );
  }

  async processing(): Promise<ProcessingHold[]> {
    const members = await this.redis(() =>
      this.client.zRangeByScore('processing-holds', 0, Date.now()),
    );
    return members.map(parseProcessingMember);
  }

  private async load(name: ScriptName): Promise<void> {
    const script = required(this.scripts.get(name));
    script.sha = await this.redis(() => this.client.scriptLoad(script.source));
  }

  private async run(
    name: ScriptName,
    keys: string[],
    args: string[],
  ): Promise<string[]> {
    const script = required(this.scripts.get(name));
    if (!script.sha) await this.load(name);
    try {
      return resultArray(
        await this.redis(() =>
          this.client.evalSha(required(script.sha), { keys, arguments: args }),
        ),
      );
    } catch (error) {
      if (!errorMessage(error).includes('NOSCRIPT')) throw error;
      await this.load(name);
      return resultArray(
        await this.redis(() =>
          this.client.evalSha(required(script.sha), { keys, arguments: args }),
        ),
      );
    }
  }

  private async redis<T>(operation: () => Promise<T>): Promise<T> {
    try {
      if (!this.client.isReady) throw new Error('Redis is not ready.');
      return await operation();
    } catch (error) {
      if (error instanceof CheckoutError) throw error;
      if (errorMessage(error).includes('NOSCRIPT')) throw error;
      this.logger.error(`Redis operation failed: ${errorMessage(error)}`);
      throw unavailable();
    }
  }
}

function inventoryKey(eventId: string) {
  return `inventory:{${eventId}}`;
}
function expirationsKey(eventId: string) {
  return `hold-expirations:{${eventId}}`;
}
function holdKey(eventId: string, id: string) {
  return `hold:{${eventId}}:${id}`;
}
function ownerKey(id: string) {
  return `hold-owner:${id}`;
}
function unavailable() {
  return new CheckoutError(
    'CHECKOUT_UNAVAILABLE',
    'Checkout temporariamente indisponível.',
  );
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Expected value.');
  return value;
}
function integer(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw unavailable();
  return parsed;
}
function paymentOutcome(value: string | undefined): 'APPROVED' | 'REFUSED' {
  if (value !== 'APPROVED' && value !== 'REFUSED') throw unavailable();
  return value;
}
function resultArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))
    throw unavailable();
  return value;
}
function hashResult(result: string[]): Record<string, string> {
  const hash: Record<string, string> = {};
  for (let index = 1; index < result.length; index += 2)
    hash[required(result[index])] = required(result[index + 1]);
  return hash;
}
function holdRecord(hash: Record<string, string>): ReservationRecord {
  return {
    id: required(hash.id),
    eventId: required(hash.eventId),
    customerId: required(hash.customerId),
    quantity: integer(hash.quantity),
    unitPriceInCents: integer(hash.unitPriceInCents),
    totalInCents: integer(hash.totalInCents),
    currency:
      hash.currency === 'BRL'
        ? 'BRL'
        : (() => {
            throw unavailable();
          })(),
    status: 'PENDING_PAYMENT',
    expiresAt: new Date(integer(hash.expiresAt)),
    createdAt: new Date(integer(hash.createdAt)),
    updatedAt: new Date(integer(hash.updatedAt)),
  };
}
function processingMember(hold: ProcessingHold) {
  return `${hold.eventId}|${hold.id}|${hold.quantity}|${hold.fencingToken}|${hold.idempotencyKey}|${hold.outcome}|${hold.customerId}`;
}
function parseProcessingMember(member: string): ProcessingHold {
  const [eventId, id, quantity, token, idempotencyKey, outcome, customerId] =
    member.split('|');
  const now = new Date();
  return {
    id: required(id),
    eventId: required(eventId),
    customerId: required(customerId),
    quantity: integer(quantity),
    unitPriceInCents: 1,
    totalInCents: integer(quantity),
    currency: 'BRL',
    status: 'PENDING_PAYMENT',
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
    fencingToken: integer(token),
    idempotencyKey: required(idempotencyKey),
    outcome: paymentOutcome(outcome),
  };
}
