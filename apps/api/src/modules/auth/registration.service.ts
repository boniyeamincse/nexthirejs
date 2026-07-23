import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordHashingService } from './password-hashing.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { VerificationTokenService } from './verification-token.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { RegisterCandidateDto } from './dto/register-candidate.dto';

export interface RegistrationResult {
  userId: string;
  email: string;
  status: 'PENDING_VERIFICATION';
  emailVerificationRequired: true;
  createdAt: string;
}

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async register(dto: RegisterCandidateDto): Promise<RegistrationResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone?.trim();

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords must match');
    }

    if (dto.password.toLowerCase() === normalizedEmail) {
      throw new BadRequestException('Password must not equal your email');
    }

    if (!dto.acceptTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])],
      },
      select: { id: true, email: true },
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        throw new ConflictException('AUTH_EMAIL_ALREADY_REGISTERED');
      }
      throw new ConflictException('AUTH_PHONE_ALREADY_REGISTERED');
    }

    const passwordHash = await this.passwordHashingService.hash(dto.password);

    const candidateRole = await this.prisma.role.findUnique({
      where: { code: 'candidate' },
    });

    if (!candidateRole) {
      this.logger.error('Candidate role not found. Ensure seed has been run.');
      throw new Error('INTERNAL_SERVER_ERROR');
    }

    let user: { id: string; email: string; status: string; createdAt: Date };

    try {
      user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: normalizedEmail,
            phone: normalizedPhone || null,
            passwordHash,
            status: 'PENDING_VERIFICATION',
          },
        });

        await tx.userRole.create({
          data: {
            userId: created.id,
            roleId: candidateRole.id,
          },
        });

        return created;
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('AUTH_EMAIL_ALREADY_REGISTERED');
      }
      this.logger.error(
        'Registration transaction failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }

    await this.auditService.recordBestEffort({
      action: 'auth.candidate.registered',
      actorType: AuditActorType.USER,
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        registrationChannel: 'web',
        accountStatus: 'PENDING_VERIFICATION',
      },
    });

    await this.enqueueVerificationEmail(user.id, normalizedEmail);

    return {
      userId: user.id,
      email: normalizedEmail,
      status: 'PENDING_VERIFICATION',
      emailVerificationRequired: true,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async enqueueVerificationEmail(userId: string, email: string): Promise<void> {
    try {
      const rawToken = await this.verificationTokenService.createToken(userId);
      await this.emailService.enqueueVerificationEmail({
        email,
        token: rawToken,
        userId,
      });
      this.logger.debug(`Verification email enqueued for ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue verification email for ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }
}
