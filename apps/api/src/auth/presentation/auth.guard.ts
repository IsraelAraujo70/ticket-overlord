import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../application/session.service';
import type { AuthenticatedSession } from '../domain/auth.types';

export interface AuthenticatedRequest extends Request {
  auth: AuthenticatedSession;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Autenticação obrigatória.',
      });
    }

    const session = await this.sessions.authenticate(token);

    if (!session) {
      throw new UnauthorizedException({
        code: 'INVALID_SESSION',
        message: 'A sessão é inválida ou expirou.',
      });
    }

    request.auth = session;
    return true;
  }
}
