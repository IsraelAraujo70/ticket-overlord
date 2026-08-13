import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { EventError, type EventErrorCode } from '../domain/event.errors';

const statusByCode: Record<EventErrorCode, HttpStatus> = {
  ORGANIZER_REQUIRED: HttpStatus.FORBIDDEN,
  ORGANIZATION_REQUIRED: HttpStatus.FORBIDDEN,
  INVALID_EVENT_DATE: HttpStatus.BAD_REQUEST,
  INVALID_EVENT_IMAGE: HttpStatus.BAD_REQUEST,
  EVENT_IMAGE_TOO_LARGE: HttpStatus.BAD_REQUEST,
  EXTERNAL_MOVIE_REQUIRED: HttpStatus.BAD_REQUEST,
  EXTERNAL_MOVIE_NOT_FOUND: HttpStatus.NOT_FOUND,
  MANUAL_EVENT_DETAILS_REQUIRED: HttpStatus.BAD_REQUEST,
  EXTERNAL_CATALOG_NOT_CONFIGURED: HttpStatus.SERVICE_UNAVAILABLE,
  EXTERNAL_CATALOG_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  EVENT_NOT_FOUND: HttpStatus.NOT_FOUND,
};

@Catch(EventError)
export class EventExceptionFilter implements ExceptionFilter {
  catch(exception: EventError, host: ArgumentsHost): void {
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
