import { Injectable } from '@nestjs/common';
import { CandidateProfileBasicsInput, CandidatePreferenceInput } from '@nexthire/validation';
import { CandidateProfileCompletion } from '@nexthire/types';

/**
 * candidate-profile-v7 weights (total = 100):
 *
 * Basic profile:         30 pts
 *   fullName             17
 *   professionalHeadline  7
 *   professionalSummary   4
 *   dateOfBirth           2
 *
 * Preferences:           18 pts
 *   countryCode           5
 *   currentCity           5
 *   preferredJobRoles     4
 *   preferredWorkModes    2
 *   preferredEmploymentTypes 2
 *
 * Education:             11 pts
 *   any record            7
 *   fieldOfStudy          2
 *   grade or description  2
 *
 * Work experience:       10 pts
 *   any record           10
 *
 * Skills:                 8 pts
 *   >=3 skills            6
 *   >=1 intermediate+     2
 *
 * Languages:              5 pts
 *   >=1 language          3
 *   >=1 prof/fluent/native speaking 2
 *
 * Certifications:         5 pts
 *   >=1 certification     4
 *   has credential ref    1
 *
 * Training:               3 pts
 *   >=1 training          3
 *
 * Achievements & Links:  10 pts
 *   >=1 achievement       4
 *   has description/url   1
 *   >=1 professional link 3
 *   has linkedin/github/portfolio/website 2
 */
@Injectable()
export class CandidateProfileCompletionService {
  private readonly basicWeights = {
    fullName: 17,
    professionalHeadline: 7,
    professionalSummary: 4,
    dateOfBirth: 2,
  };

  private readonly preferenceWeights = {
    countryCode: 5,
    currentCity: 5,
    preferredJobRoles: 4,
    preferredWorkModes: 2,
    preferredEmploymentTypes: 2,
  };

  calculateCompletion(
    profile: Partial<CandidateProfileBasicsInput> | null,
    preferences?: Partial<CandidatePreferenceInput> | null,
    educationRecords?: any[] | null,
    workExperienceRecords?: any[] | null,
    skills?: any[] | null,
    languages?: any[] | null,
    certifications?: any[] | null,
    training?: any[] | null,
    achievements?: any[] | null,
    professionalLinks?: any[] | null,
  ): CandidateProfileCompletion {
    let percentage = 0;
    const completedFields: string[] = [];
    const missingFields: string[] = [];

    // Basic fields
    for (const [field, weight] of Object.entries(this.basicWeights)) {
      if (!profile) {
        missingFields.push(field);
        continue;
      }
      const value = profile[field as keyof CandidateProfileBasicsInput];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        percentage += weight;
        completedFields.push(field);
      } else {
        missingFields.push(field);
      }
    }

    // Preference fields
    for (const [field, weight] of Object.entries(this.preferenceWeights)) {
      if (!preferences) {
        missingFields.push(field);
        continue;
      }
      const value = preferences[field as keyof CandidatePreferenceInput];
      if (Array.isArray(value)) {
        if (value.length > 0) {
          percentage += weight;
          completedFields.push(field);
        } else {
          missingFields.push(field);
        }
      } else if (value !== null && value !== undefined && String(value).trim() !== '') {
        percentage += weight;
        completedFields.push(field);
      } else {
        missingFields.push(field);
      }
    }

    // Education fields (11 pts)
    if (educationRecords && educationRecords.length > 0) {
      percentage += 7;
      completedFields.push('education');

      const hasFieldOfStudy = educationRecords.some(
        (r) =>
          r.fieldOfStudy !== null &&
          r.fieldOfStudy !== undefined &&
          String(r.fieldOfStudy).trim() !== '',
      );
      if (hasFieldOfStudy) {
        percentage += 2;
        completedFields.push('educationFieldOfStudy');
      } else {
        missingFields.push('educationFieldOfStudy');
      }

      const hasGradeOrDescription = educationRecords.some(
        (r) =>
          (r.grade !== null && r.grade !== undefined && String(r.grade).trim() !== '') ||
          (r.description !== null &&
            r.description !== undefined &&
            String(r.description).trim() !== ''),
      );
      if (hasGradeOrDescription) {
        percentage += 2;
        completedFields.push('educationGradeOrDescription');
      } else {
        missingFields.push('educationGradeOrDescription');
      }
    } else {
      missingFields.push('education');
      missingFields.push('educationFieldOfStudy');
      missingFields.push('educationGradeOrDescription');
    }

    // Work experience fields (10 pts)
    if (workExperienceRecords && workExperienceRecords.length > 0) {
      percentage += 10;
      completedFields.push('workExperience');
    } else {
      missingFields.push('workExperience');
    }

    // Skills fields (8 pts)
    if (skills && skills.length >= 3) {
      percentage += 6;
      completedFields.push('skillsCount');
    } else {
      missingFields.push('skillsCount');
    }

    const hasIntermediateSkill = skills?.some((r) =>
      ['INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(r.level),
    );
    if (hasIntermediateSkill) {
      percentage += 2;
      completedFields.push('skillsLevel');
    } else {
      missingFields.push('skillsLevel');
    }

    // Languages fields (5 pts)
    if (languages && languages.length >= 1) {
      percentage += 3;
      completedFields.push('languagesCount');
    } else {
      missingFields.push('languagesCount');
    }

    const hasProficientSpeaking = languages?.some((r) =>
      ['PROFESSIONAL', 'FLUENT', 'NATIVE'].includes(r.speaking),
    );
    if (hasProficientSpeaking) {
      percentage += 2;
      completedFields.push('languagesProficiency');
    } else {
      missingFields.push('languagesProficiency');
    }

    // Certifications fields (5 pts)
    if (certifications && certifications.length >= 1) {
      percentage += 4;
      completedFields.push('certifications');
    } else {
      missingFields.push('certifications');
    }

    const hasCredentialReference = certifications?.some(
      (r) =>
        (r.credentialId !== null &&
          r.credentialId !== undefined &&
          String(r.credentialId).trim() !== '') ||
        (r.credentialUrl !== null &&
          r.credentialUrl !== undefined &&
          String(r.credentialUrl).trim() !== ''),
    );
    if (hasCredentialReference) {
      percentage += 1;
      completedFields.push('certificationsCredential');
    } else {
      missingFields.push('certificationsCredential');
    }

    // Training fields (3 pts)
    if (training && training.length >= 1) {
      percentage += 3;
      completedFields.push('training');
    } else {
      missingFields.push('training');
    }

    // Achievements & Professional Links fields (10 pts)
    if (achievements && achievements.length >= 1) {
      percentage += 4;
      completedFields.push('achievements');
    } else {
      missingFields.push('achievements');
    }

    const hasAchievementDetail = achievements?.some(
      (r) =>
        (r.description !== null &&
          r.description !== undefined &&
          String(r.description).trim() !== '') ||
        (r.referenceUrl !== null &&
          r.referenceUrl !== undefined &&
          String(r.referenceUrl).trim() !== ''),
    );
    if (hasAchievementDetail) {
      percentage += 1;
      completedFields.push('achievementsDetail');
    } else {
      missingFields.push('achievementsDetail');
    }

    if (professionalLinks && professionalLinks.length >= 1) {
      percentage += 3;
      completedFields.push('professionalLinks');
    } else {
      missingFields.push('professionalLinks');
    }

    const hasKeyLink = professionalLinks?.some((r) =>
      ['LINKEDIN', 'GITHUB', 'PORTFOLIO', 'PERSONAL_WEBSITE'].includes(r.type),
    );
    if (hasKeyLink) {
      percentage += 2;
      completedFields.push('professionalLinksKey');
    } else {
      missingFields.push('professionalLinksKey');
    }

    return {
      percentage,
      completedFields,
      missingFields,
      version: 'candidate-profile-v7',
    };
  }
}
