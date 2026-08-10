import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'SP' })
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

  @ApiProperty({ example: '11.222.333/0001-81' })
  @IsString()
  @IsNotEmpty()
  cnpj!: string;

  @ApiProperty({ example: '(11) 99999-9999' })
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

  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
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
  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
  password!: string;
}
