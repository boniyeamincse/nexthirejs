/**
 * @nexthire/validation
 *
 * Shared validation schemas for NextHire.
 */

// Re-export all schemas for convenience
export * from './common.js';
export * from './pagination.js';
export * from './auth/candidate-registration.js';
export * from './auth/candidate-login.js';
export * from './auth/candidate-account-security.js';
export * from './auth/mfa.js';
export * from './candidates/candidate-profile-basics.js';
export * from './candidates/candidate-preferences.js';
export * from './candidates/candidate-education.js';
export * from './candidates/candidate-work-experience.js';
export * from './candidates/candidate-skills.js';
export * from './candidates/candidate-languages.js';
export * from './candidates/candidate-certifications.js';
export * from './candidates/candidate-training.js';
export * from './candidates/candidate-achievements.js';
export * from './candidates/candidate-professional-links.js';
export * from './candidates/candidate-profile-privacy.js';
export * from './candidates/candidate-account-lifecycle.js';
export * from './assessments/assessment-catalog.js';
export * from './assessments/assessment-lifecycle.js';
export * from './assessments/management.js';
export * from './assessments/authoring.js';
export * from './assessments/attempts.js';
export * from './assessments/retakes.js';
export * from './assessments/certificates.js';
export * from './experts/index.js';
