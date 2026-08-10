import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStatusDto } from './api-status.dto';
import { AppService } from './app.service';

@ApiTags('Status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    operationId: 'getApiStatus',
    summary: 'Consultar o estado da API',
    description:
      'Retorna a identificação do serviço e confirma que o processo HTTP está respondendo.',
  })
  @ApiOkResponse({
    description: 'API disponível.',
    type: ApiStatusDto,
  })
  getStatus(): ApiStatusDto {
    return this.appService.getStatus();
  }
}
