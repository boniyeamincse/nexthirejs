import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../../infrastructure/email/email.module';
import { PasswordHashingService } from './password-hashing.service';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';
import { VerificationTokenService } from './verification-token.service';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { SessionController } from './session.controller';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { AuthGuard } from './auth.guard';
import { AccountSecurityController } from './account-security/account-security.controller';
import { AccountSecurityService } from './account-security/account-security.service';
import { ChangePasswordController } from './account-security/change-password.controller';
import { ChangePasswordService } from './account-security/change-password.service';

@Module({
  imports: [DatabaseModule, AuditModule, EmailModule],
  controllers: [
    RegistrationController,
    EmailVerificationController,
    LoginController,
    SessionController,
    AccountSecurityController,
    ChangePasswordController,
  ],
  providers: [
    PasswordHashingService,
    RegistrationService,
    VerificationTokenService,
    EmailVerificationService,
    LoginService,
    TokenService,
    SessionService,
    AuthGuard,
    AccountSecurityService,
    ChangePasswordService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [PasswordHashingService, VerificationTokenService, TokenService, SessionService],
})
export class AuthModule {}
