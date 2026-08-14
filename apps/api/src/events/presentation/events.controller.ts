import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedSession } from '../../auth/domain/auth.types';
import { AuthGuard } from '../../auth/presentation/auth.guard';
import { RateLimit } from '../../rate-limit/presentation/rate-limit.decorator';
import { RateLimitGuard } from '../../rate-limit/presentation/rate-limit.guard';
import { CurrentAuth } from '../../auth/presentation/current-auth.decorator';
import { CreateEventService } from '../application/create-event.service';
import { ListEventsService } from '../application/list-events.service';
import { PublishEventService } from '../application/publish-event.service';
import { EVENT_IMAGE_MAX_BYTES } from '../domain/event.types';
import { EventExceptionFilter } from './event-exception.filter';
import {
  CreateEventDto,
  EventCoverUrlDto,
  EventDto,
  EventListQueryDto,
  EventPageDto,
} from './dto/event.dto';

@ApiTags('Events')
@UseFilters(EventExceptionFilter)
@Controller('events')
export class EventsController {
  constructor(
    private readonly createEvent: CreateEventService,
    private readonly listEvents: ListEventsService,
    private readonly publishEvent: PublishEventService,
  ) {}

  @Get('published')
  @ApiOperation({ summary: 'Listar eventos publicados' })
  @ApiOkResponse({ type: EventPageDto })
  published(@Query() query: EventListQueryDto): Promise<EventPageDto> {
    return this.listEvents.published(query);
  }

  @Get('published/:eventId/cover')
  @ApiOperation({ summary: 'Gerar URL temporária da capa publicada' })
  @ApiOkResponse({ type: EventCoverUrlDto })
  @ApiNotFoundResponse({ description: 'Evento publicado não encontrado.' })
  async publishedCover(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventCoverUrlDto> {
    return { url: await this.listEvents.publishedCover(eventId) };
  }

  @Get()
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Listar eventos visíveis na administração',
    description:
      'Organizadores recebem apenas os eventos da própria organização. Administradores globais recebem todos os eventos em modo somente leitura.',
  })
  @ApiOkResponse({ type: EventPageDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem acesso administrativo.' })
  forOrganizer(
    @CurrentAuth() auth: AuthenticatedSession,
    @Query() query: EventListQueryDto,
  ): Promise<EventPageDto> {
    return this.listEvents.forOrganizer(auth.user, query);
  }

  @Get(':eventId/cover')
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Gerar URL temporária de uma capa visível na administração',
  })
  @ApiOkResponse({ type: EventCoverUrlDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiNotFoundResponse({ description: 'Evento visível não encontrado.' })
  async organizerCover(
    @CurrentAuth() auth: AuthenticatedSession,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventCoverUrlDto> {
    return {
      url: await this.listEvents.coverForOrganizer(auth.user, eventId),
    };
  }

  @Post()
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard, RateLimitGuard)
  @RateLimit({
    name: 'create-event',
    limit: 30,
    windowSeconds: 3600,
    identities: ['organization'],
  })
  @UseInterceptors(
    FileInterceptor('cover', { limits: { fileSize: EVENT_IMAGE_MAX_BYTES } }),
  )
  @ApiOperation({ summary: 'Criar um evento local em rascunho' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'category',
        'startsAt',
        'venue',
        'city',
        'capacity',
        'priceInCents',
        'cover',
      ],
      properties: {
        category: { type: 'string', example: 'Cinema' },
        externalId: { type: 'string', example: '157336' },
        title: { type: 'string', example: 'Festival de Jazz' },
        summary: {
          type: 'string',
          example: 'Uma noite dedicada ao jazz brasileiro.',
        },
        startsAt: { type: 'string', format: 'date-time' },
        venue: { type: 'string' },
        city: { type: 'string' },
        capacity: { type: 'integer', minimum: 1 },
        priceInCents: { type: 'integer', minimum: 1 },
        cover: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: EventDto })
  @ApiBadRequestResponse({ description: 'Campos ou capa inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem permissão de organizador.' })
  create(
    @CurrentAuth() auth: AuthenticatedSession,
    @Body() dto: CreateEventDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: EVENT_IMAGE_MAX_BYTES }),
        ],
      }),
    )
    cover: Express.Multer.File,
  ): Promise<EventDto> {
    return this.createEvent.create(auth.user, {
      ...dto,
      cover: cover.buffer,
    });
  }

  @Post(':eventId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Publicar um evento da organização autenticada' })
  @ApiOkResponse({ type: EventDto })
  @ApiBadRequestResponse({
    description: 'A sessão do evento já começou.',
  })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem permissão de organizador.' })
  @ApiNotFoundResponse({ description: 'Evento da organização não encontrado.' })
  publish(
    @CurrentAuth() auth: AuthenticatedSession,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventDto> {
    return this.publishEvent.publish(auth.user, eventId);
  }
}
