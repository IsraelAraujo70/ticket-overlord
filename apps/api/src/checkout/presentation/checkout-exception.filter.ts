import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CheckoutError,
  type CheckoutErrorCode,
} from '../domain/checkout.errors';

const statusByCode: Record<CheckoutErrorCode, HttpStatus> = {
  CUSTOMER_REQUIRED: HttpStatus.FORBIDDEN,
  INVALID_QUANTITY: HttpStatus.BAD_REQUEST,
  EVENT_NOT_AVAILABLE: HttpStatus.NOT_FOUND,
  INSUFFICIENT_INVENTORY: HttpStatus.CONFLICT,
  RESERVATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  RESERVATION_EXPIRED: HttpStatus.CONFLICT,
  RESERVATION_NOT_PAYABLE: HttpStatus.CONFLICT,
  IDEMPOTENCY_CONFLICT: HttpStatus.CONFLICT,
  CHECKOUT_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
};

@Catch(CheckoutError)
export class CheckoutExceptionFilter implements ExceptionFilter {
  catch(exception: CheckoutError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusByCode[exception.code])
      .json({ code: exception.code, message: exception.message });
  }
}
