import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedSession } from '../domain/auth.types';
import type { AuthenticatedRequest } from './auth.guard';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedSession => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  },
);
