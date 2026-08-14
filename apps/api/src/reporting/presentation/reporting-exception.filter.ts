import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportingError } from '../domain/reporting.errors';

@Catch(ReportingError)
export class ReportingExceptionFilter implements ExceptionFilter {
  catch(exception: ReportingError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.FORBIDDEN)
      .json({
        code: exception.code,
        message: exception.message,
      });
  }
}
