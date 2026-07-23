import { MfaPolicyService } from './mfa-policy.service';

describe('MfaPolicyService', () => {
  const service = new MfaPolicyService();

  it('does not require MFA for candidates', () => {
    expect(service.isMfaRequiredForRoles(['candidate'])).toBe(false);
  });

  it('requires MFA for experts', () => {
    expect(service.isMfaRequiredForRoles(['candidate', 'expert'])).toBe(true);
  });

  it('requires MFA for reviewers and managers', () => {
    expect(service.isMfaRequiredForRoles(['expert_application_reviewer'])).toBe(true);
    expect(service.isMfaRequiredForRoles(['assessment_manager'])).toBe(true);
  });

  it('requires MFA for superadmin and company privileged roles', () => {
    expect(service.isMfaRequiredForRoles(['superadmin'])).toBe(true);
    expect(service.isMfaRequiredForRoles(['company_owner'])).toBe(true);
    expect(service.isMfaRequiredForRoles(['company_admin'])).toBe(true);
  });

  it('handles empty role lists', () => {
    expect(service.isMfaRequiredForRoles([])).toBe(false);
  });
});
