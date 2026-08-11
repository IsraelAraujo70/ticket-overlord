import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthError } from '../domain/auth.errors';

@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter<AuthError> {
  catch(error: AuthError, host: ArgumentsHost): void {
    const body = { code: error.code, message: error.message };
    const exception = this.toHttpException(error, body);
    const response = host.switchToHttp().getResponse<Response>();

    response.status(exception.getStatus()).json(exception.getResponse());
  }

  private toHttpException(
    error: AuthError,
    body: { code: string; message: string },
  ) {
    switch (error.code) {
      case 'EMAIL_ALREADY_REGISTERED':
      case 'CNPJ_ALREADY_REGISTERED':
        return new ConflictException(body);
      case 'INVALID_CREDENTIALS':
        return new UnauthorizedException(body);
      case 'EMAIL_NOT_VERIFIED':
        return new ForbiddenException(body);
      default:
        return new BadRequestException(body);
    }
  }
}
