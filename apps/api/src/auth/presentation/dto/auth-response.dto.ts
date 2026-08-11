import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Maria Silva' })
  fullName!: string;

  @ApiProperty({ example: 'maria@example.com' })
  email!: string;

  @ApiProperty({
    enum: ['CUSTOMER', 'ORGANIZER', 'ADMIN', 'ORGANIZER_STAFF'],
  })
  role!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  organizationId!: string | null;
}

export class RegistrationResponseDto {
  @ApiProperty({ enum: ['EMAIL_CONFIRMATION_REQUIRED'] })
  status!: 'EMAIL_CONFIRMATION_REQUIRED';
}

export class LoginResponseDto {
  @ApiProperty({ writeOnly: true })
  accessToken!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
