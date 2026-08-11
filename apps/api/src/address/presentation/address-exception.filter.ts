import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AddressLookupError } from '../domain/address';

@Catch(AddressLookupError)
export class AddressExceptionFilter implements ExceptionFilter<AddressLookupError> {
  catch(error: AddressLookupError, host: ArgumentsHost): void {
    const body = { code: error.code, message: error.message };
    const response = host.switchToHttp().getResponse<Response>();
    const exception =
      error.code === 'INVALID_POSTAL_CODE'
        ? new BadRequestException(body)
        : error.code === 'POSTAL_CODE_NOT_FOUND'
          ? new NotFoundException(body)
          : new ServiceUnavailableException(body);

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
