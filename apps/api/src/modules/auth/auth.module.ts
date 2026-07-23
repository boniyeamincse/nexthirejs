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
import { PhoneVerificationService } from './phone-verification.service';
import { PhoneVerificationController } from './phone-verification.controller';
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
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { MfaController } from './mfa/mfa.controller';
import { MfaService } from './mfa/mfa.service';
import { MfaChallengeService } from './mfa/mfa-challenge.service';
import { MfaTrustedDeviceService } from './mfa/mfa-trusted-device.service';
import { MfaEncryptionService } from './mfa/mfa-encryption.service';
import { MfaPolicyService } from './mfa/mfa-policy.service';
import { MfaRequiredGuard } from './mfa/mfa-required.guard';

@Module({
  imports: [DatabaseModule, AuditModule, EmailModule],
  controllers: [
    RegistrationController,
    EmailVerificationController,
    PhoneVerificationController,
    LoginController,
    SessionController,
    AccountSecurityController,
    ChangePasswordController,
    PasswordResetController,
    OnboardingController,
    MfaController,
  ],
  providers: [
    PasswordHashingService,
    RegistrationService,
    VerificationTokenService,
    EmailVerificationService,
    PhoneVerificationService,
    LoginService,
    TokenService,
    SessionService,
    AuthGuard,
    AccountSecurityService,
    ChangePasswordService,
    PasswordResetService,
    OnboardingService,
    MfaService,
    MfaChallengeService,
    MfaTrustedDeviceService,
    MfaEncryptionService,
    MfaPolicyService,
    MfaRequiredGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [
    PasswordHashingService,
    VerificationTokenService,
    TokenService,
    SessionService,
    MfaPolicyService,
    MfaRequiredGuard,
  ],
})
export class AuthModule {}
