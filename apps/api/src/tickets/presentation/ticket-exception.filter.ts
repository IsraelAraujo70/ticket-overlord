import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { TicketError, type TicketErrorCode } from '../domain/ticket.errors';

const statusByCode: Record<TicketErrorCode, HttpStatus> = {
  CUSTOMER_REQUIRED: HttpStatus.FORBIDDEN,
  GATE_ACCESS_REQUIRED: HttpStatus.FORBIDDEN,
  TICKET_NOT_FOUND: HttpStatus.NOT_FOUND,
  EVENT_NOT_FOUND: HttpStatus.NOT_FOUND,
};

@Catch(TicketError)
export class TicketExceptionFilter implements ExceptionFilter {
  catch(exception: TicketError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusByCode[exception.code])
      .json({
        code: exception.code,
        message: exception.message,
      });
  }
}
