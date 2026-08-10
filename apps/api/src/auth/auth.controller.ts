import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuthError } from './auth.errors';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentAuth } from './current-auth.decorator';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto';
import {
  LoginResponseDto,
  RegistrationResponseDto,
  UserDto,
} from './dto/auth-response.dto';
import type { AuthenticatedSession } from './auth.types';

function mapAuthError(error: unknown): never {
  if (!(error instanceof AuthError)) {
    throw error;
  }

  const body = { code: error.code, message: error.message };

  switch (error.code) {
    case 'EMAIL_ALREADY_REGISTERED':
    case 'CNPJ_ALREADY_REGISTERED':
      throw new ConflictException(body);
    case 'INVALID_CREDENTIALS':
      throw new UnauthorizedException(body);
    case 'EMAIL_NOT_VERIFIED':
      throw new ForbiddenException(body);
    default:
      throw new BadRequestException(body);
  }
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar cliente ou organizador' })
  @ApiCreatedResponse({ type: RegistrationResponseDto })
  @ApiBadRequestResponse({ description: 'Dados de cadastro inválidos.' })
  @ApiConflictResponse({ description: 'E-mail ou CNPJ já cadastrado.' })
  async register(@Body() dto: RegisterDto): Promise<RegistrationResponseDto> {
    try {
      return await this.authService.register(dto);
    } catch (error) {
      mapAuthError(error);
    }
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirmar o e-mail' })
  @ApiNoContentResponse({ description: 'E-mail confirmado.' })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado.' })
  async confirmEmail(@Body() dto: TokenDto): Promise<void> {
    try {
      await this.authService.confirmEmail(dto);
    } catch (error) {
      mapAuthError(error);
    }
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reenviar confirmação sem enumerar contas' })
  @ApiNoContentResponse({ description: 'Solicitação processada.' })
  async resendEmailConfirmation(@Body() dto: EmailDto): Promise<void> {
    await this.authService.resendEmailConfirmation(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar uma conta verificada' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  @ApiForbiddenResponse({ description: 'E-mail ainda não confirmado.' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.authService.login(dto);
    } catch (error) {
      mapAuthError(error);
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar a identidade da sessão' })
  @ApiOkResponse({ type: UserDto })
  me(@CurrentAuth() auth: AuthenticatedSession): UserDto {
    return auth.user;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revogar a sessão atual' })
  @ApiNoContentResponse({ description: 'Sessão revogada.' })
  async logout(@CurrentAuth() auth: AuthenticatedSession): Promise<void> {
    await this.authService.logout(auth.tokenHash);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Solicitar recuperação sem enumerar contas' })
  @ApiNoContentResponse({ description: 'Solicitação processada.' })
  async forgotPassword(@Body() dto: EmailDto): Promise<void> {
    await this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Redefinir senha com token de uso único' })
  @ApiNoContentResponse({ description: 'Senha redefinida.' })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado.' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    try {
      await this.authService.resetPassword(dto);
    } catch (error) {
      mapAuthError(error);
    }
  }
}
