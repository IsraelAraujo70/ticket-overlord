import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EmailVerificationService } from '../application/email-verification.service';
import { PasswordRecoveryService } from '../application/password-recovery.service';
import { RegistrationService } from '../application/registration.service';
import { SessionService } from '../application/session.service';
import type { AuthenticatedSession } from '../domain/auth.types';
import { AuthExceptionFilter } from './auth-exception.filter';
import { AuthGuard } from './auth.guard';
import { CurrentAuth } from './current-auth.decorator';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto';
import {
  EmailConfirmationResponseDto,
  LoginResponseDto,
  RegistrationResponseDto,
  UserDto,
} from './dto/auth-response.dto';

@ApiTags('Authentication')
@UseFilters(AuthExceptionFilter)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registration: RegistrationService,
    private readonly emailVerification: EmailVerificationService,
    private readonly sessions: SessionService,
    private readonly passwordRecovery: PasswordRecoveryService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar cliente ou organizador' })
  @ApiCreatedResponse({ type: RegistrationResponseDto })
  @ApiBadRequestResponse({ description: 'Dados de cadastro inválidos.' })
  @ApiConflictResponse({ description: 'E-mail ou CNPJ já cadastrado.' })
  register(@Body() dto: RegisterDto): Promise<RegistrationResponseDto> {
    return this.registration.register(dto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar o e-mail' })
  @ApiOkResponse({ type: EmailConfirmationResponseDto })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado.' })
  confirmEmail(@Body() dto: TokenDto): Promise<EmailConfirmationResponseDto> {
    return this.emailVerification.confirm(dto.token);
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reenviar confirmação sem enumerar contas' })
  @ApiNoContentResponse({ description: 'Solicitação processada.' })
  resendEmailConfirmation(@Body() dto: EmailDto): Promise<void> {
    return this.emailVerification.resend(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar uma conta verificada' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  @ApiForbiddenResponse({ description: 'E-mail ainda não confirmado.' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.sessions.login(dto);
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
  logout(@CurrentAuth() auth: AuthenticatedSession): Promise<void> {
    return this.sessions.logout(auth.tokenHash);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Solicitar recuperação sem enumerar contas' })
  @ApiNoContentResponse({ description: 'Solicitação processada.' })
  forgotPassword(@Body() dto: EmailDto): Promise<void> {
    return this.passwordRecovery.requestReset(dto.email);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Redefinir senha com token de uso único' })
  @ApiNoContentResponse({ description: 'Senha redefinida.' })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado.' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.passwordRecovery.reset(dto.token, dto.password);
  }
}
