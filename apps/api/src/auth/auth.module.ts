import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { EmailVerificationService } from './application/email-verification.service';
import { PasswordRecoveryService } from './application/password-recovery.service';
import { AuthStore } from './application/ports/auth-store';
import { PasswordHasher } from './application/ports/password-hasher';
import { TokenGenerator } from './application/ports/token-generator';
import { RegistrationService } from './application/registration.service';
import { SessionService } from './application/session.service';
import { emailSenderProvider } from './infrastructure/email/email-sender.provider';
import { DrizzleAuthStore } from './infrastructure/persistence/drizzle-auth-store';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher';
import { SecureTokenGenerator } from './infrastructure/security/secure-token-generator';
import { AuthController } from './presentation/auth.controller';
import { AuthExceptionFilter } from './presentation/auth-exception.filter';
import { AuthGuard } from './presentation/auth.guard';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [AuthController],
  providers: [
    RegistrationService,
    EmailVerificationService,
    SessionService,
    PasswordRecoveryService,
    AuthGuard,
    AuthExceptionFilter,
    emailSenderProvider,
    { provide: AuthStore, useClass: DrizzleAuthStore },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: TokenGenerator, useClass: SecureTokenGenerator },
  ],
  exports: [SessionService, AuthGuard],
})
export class AuthModule {}
