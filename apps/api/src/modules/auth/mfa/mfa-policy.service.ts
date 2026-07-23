import { Injectable } from '@nestjs/common';
import { MFA_REQUIRED_ROLE_CODES } from '@nexthire/constants';

/**
 * Central mandatory-MFA policy.
 *
 * Candidate MFA is optional. Roles listed in MFA_REQUIRED_ROLE_CODES
 * (expert, reviewers, managers, company privileged members, superadmin)
 * must have MFA enabled for sensitive workflows. Enforcement points use
 * this service so the policy stays in one place.
 */
@Injectable()
export class MfaPolicyService {
  private readonly requiredRoles = new Set<string>(MFA_REQUIRED_ROLE_CODES);

  isMfaRequiredForRoles(roleCodes: readonly string[]): boolean {
    return roleCodes.some((code) => this.requiredRoles.has(code));
  }
}
