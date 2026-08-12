import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetPublishedEventService } from '../application/get-published-event.service';
import { CheckoutExceptionFilter } from './checkout-exception.filter';
import { PublishedEventDetailDto } from './dto/checkout.dto';

@ApiTags('Events')
@UseFilters(CheckoutExceptionFilter)
@Controller('events')
export class PublishedEventController {
  constructor(private readonly getPublishedEvent: GetPublishedEventService) {}

  @Get('published/:slug')
  @ApiOperation({ summary: 'Obter detalhe e disponibilidade do evento' })
  @ApiOkResponse({ type: PublishedEventDetailDto })
  @ApiNotFoundResponse({ description: 'Evento não disponível para venda.' })
  @ApiServiceUnavailableResponse({
    description: 'Checkout temporariamente indisponível.',
  })
  bySlug(@Param('slug') slug: string): Promise<PublishedEventDetailDto> {
    return this.getPublishedEvent.bySlug(slug);
  }
}
