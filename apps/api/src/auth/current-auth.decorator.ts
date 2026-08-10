import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard';
import type { AuthenticatedSession } from './auth.types';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedSession => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  },
);
