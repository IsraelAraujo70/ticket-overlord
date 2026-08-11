import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_PATTERN,
} from '../../domain/validation/password';

const strongPasswordApiProperty = {
  minLength: 12,
  maxLength: 128,
  pattern: STRONG_PASSWORD_PATTERN.source,
  description:
    'Deve incluir letra maiúscula, letra minúscula, número e símbolo.',
  writeOnly: true,
} as const;

export class OrganizerAddressDto {
  @ApiProperty({ example: '01001000' })
  @IsString()
  @Length(8, 9)
  postalCode!: string;

  @ApiProperty({ example: 'Praça da Sé' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  street!: string;

  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  number!: string;

  @ApiPropertyOptional({ example: 'Sala 4' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string;

  @ApiProperty({ example: 'Sé' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  neighborhood!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city!: string;

  @ApiProperty({
    example: 'SP',
    description: 'Sigla de uma das 27 unidades federativas brasileiras.',
  })
  @IsString()
  @Length(2, 2)
  state!: string;
}

export class OrganizerRegistrationDto {
  @ApiProperty({ example: 'Produtora Aurora' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @ApiProperty({
    example: '12.ABC.345/01DE-35',
    description:
      'CNPJ numérico ou alfanumérico. É persistido sem pontuação e em maiúsculas.',
  })
  @IsString()
  @IsNotEmpty()
  cnpj!: string;

  @ApiProperty({
    example: '+55 35 99742-1900',
    description:
      'Telefone brasileiro em formato nacional ou com +55. É persistido em E.164.',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ type: OrganizerAddressDto })
  @ValidateNested()
  @Type(() => OrganizerAddressDto)
  address!: OrganizerAddressDto;
}

export class RegisterDto {
  @ApiProperty({ enum: ['customer', 'organizer'] })
  @IsIn(['customer', 'organizer'])
  accountType!: 'customer' | 'organizer';

  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  fullName!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty(strongPasswordApiProperty)
  @IsString()
  @Length(12, 128)
  @Matches(STRONG_PASSWORD_PATTERN, { message: STRONG_PASSWORD_MESSAGE })
  password!: string;

  @ApiPropertyOptional({ type: OrganizerRegistrationDto })
  @ValidateIf((dto: RegisterDto) => dto.accountType === 'organizer')
  @ValidateNested()
  @Type(() => OrganizerRegistrationDto)
  organization?: OrganizerRegistrationDto;
}

export class LoginDto {
  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ writeOnly: true })
  @IsString()
  password!: string;
}

export class EmailDto {
  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;
}

export class TokenDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResetPasswordDto extends TokenDto {
  @ApiProperty(strongPasswordApiProperty)
  @IsString()
  @Length(12, 128)
  @Matches(STRONG_PASSWORD_PATTERN, { message: STRONG_PASSWORD_MESSAGE })
  password!: string;
}
