import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MfaPolicyService } from './mfa-policy.service';
import { MFA_ERROR_CODES } from '@nexthire/constants';
import type { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';

/**
 * Enforces the mandatory-MFA policy on sensitive workflows.
 *
 * Apply after AuthGuard/RolesGuard. When the authenticated user holds a role
 * listed in MFA_REQUIRED_ROLE_CODES and has not enabled MFA, the request is
 * rejected with MFA_REQUIRED_BY_POLICY so clients can redirect to setup.
 * Users whose roles do not require MFA pass through unchanged.
 */
@Injectable()
export class MfaRequiredGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: MfaPolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ principal?: AuthenticatedPrincipal; user?: AuthenticatedPrincipal }>();
    const principal = request.principal ?? request.user;

    if (!principal) {
      return true; // AuthGuard is responsible for authentication
    }

    if (!this.policyService.isMfaRequiredForRoles(principal.roleCodes)) {
      return true;
    }

    const mfa = await this.prisma.userMfa.findUnique({
      where: { userId: principal.userId },
      select: { status: true },
    });

    if (mfa?.status !== 'ENABLED') {
      throw new ForbiddenException(MFA_ERROR_CODES.REQUIRED_BY_POLICY);
    }

    return true;
  }
}
