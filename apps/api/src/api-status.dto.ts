import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ApiStatus' })
export class ApiStatusDto {
  @ApiProperty({
    enum: ['ticket-overlord-api'],
    example: 'ticket-overlord-api',
  })
  name!: 'ticket-overlord-api';

  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';
}
