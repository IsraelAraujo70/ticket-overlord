import { createHash } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedRequest } from '../../auth/presentation/auth.guard';
import { RateLimiter } from '../application/rate-limiter';
import {
  RATE_LIMIT_METADATA,
  type RateLimitIdentity,
  type RateLimitOptions,
} from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: RateLimiter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_METADATA,
      context.getHandler(),
    );
    if (!options) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & Partial<AuthenticatedRequest>>();

    try {
      for (const identity of options.identities) {
        const value = identityValue(request, identity);
        const allowed = await this.limiter.consume(
          `${options.name}:${identity}:${digest(value)}`,
          options.limit,
          options.windowSeconds,
        );
        if (!allowed) {
          throw new HttpException(
            {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Muitas tentativas. Aguarde antes de tentar novamente.',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException({
        code: 'RATE_LIMIT_UNAVAILABLE',
        message: 'Não foi possível validar o limite de tentativas.',
      });
    }

    return true;
  }
}

function identityValue(
  request: Request & Partial<AuthenticatedRequest>,
  identity: RateLimitIdentity,
): string {
  const body = isRecord(request.body) ? request.body : {};
  if (identity === 'email') {
    return stringField(body.email).trim().toLowerCase();
  }
  if (identity === 'token') return stringField(body.token);
  if (identity === 'organization') {
    return (
      request.auth?.user.organizationId ?? request.auth?.user.id ?? 'missing'
    );
  }
  return request.ip || request.socket.remoteAddress || 'unknown';
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : 'missing';
}
