import { Injectable } from '@nestjs/common';
import { CandidateProfileBasicsInput, CandidatePreferenceInput } from '@nexthire/validation';
import { CandidateProfileCompletion } from '@nexthire/types';

/**
 * candidate-profile-v5 weights (total = 100):
 *
 * Basic profile:         35 pts
 *   fullName             20
 *   professionalHeadline  8
 *   professionalSummary   5
 *   dateOfBirth           2
 *
 * Preferences:           25 pts
 *   countryCode           8
 *   currentCity           8
 *   preferredJobRoles     5
 *   preferredWorkModes    2
 *   preferredEmploymentTypes 2
 *
 * Education:             15 pts
 *   any record           10
 *   fieldOfStudy          3
 *   grade or description  2
 *
 * Work experience:       10 pts
 *   any record           10
 *
 * Skills:                10 pts
 *   >=3 skills            8
 *   >=1 intermediate+     2
 *
 * Languages:              5 pts
 *   >=1 language          3
 *   >=1 prof/fluent/native speaking 2
 */
@Injectable()
export class CandidateProfileCompletionService {
  private readonly basicWeights = {
    fullName: 20,
    professionalHeadline: 8,
    professionalSummary: 5,
    dateOfBirth: 2,
  };

  private readonly preferenceWeights = {
    countryCode: 8,
    currentCity: 8,
    preferredJobRoles: 5,
    preferredWorkModes: 2,
    preferredEmploymentTypes: 2,
  };

  calculateCompletion(
    profile: Partial<CandidateProfileBasicsInput> | null,
    preferences?: Partial<CandidatePreferenceInput> | null,
    educationRecords?: any[] | null,
    workExperienceRecords?: any[] | null,
    skills?: any[] | null,
    languages?: any[] | null
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

    // Education fields (15 pts)
    if (educationRecords && educationRecords.length > 0) {
      percentage += 10;
      completedFields.push('education');

      const hasFieldOfStudy = educationRecords.some(
        (r) => r.fieldOfStudy !== null && r.fieldOfStudy !== undefined && String(r.fieldOfStudy).trim() !== ''
      );
      if (hasFieldOfStudy) {
        percentage += 3;
        completedFields.push('educationFieldOfStudy');
      } else {
        missingFields.push('educationFieldOfStudy');
      }

      const hasGradeOrDescription = educationRecords.some(
        (r) =>
          (r.grade !== null && r.grade !== undefined && String(r.grade).trim() !== '') ||
          (r.description !== null && r.description !== undefined && String(r.description).trim() !== '')
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

    // Skills fields (10 pts)
    if (skills && skills.length >= 3) {
      percentage += 8;
      completedFields.push('skillsCount');
    } else {
      missingFields.push('skillsCount');
    }

    const hasIntermediateSkill = skills?.some(
      (r) => ['INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(r.level)
    );
    if (hasIntermediateSkill) {
      percentage += 2;
      completedFields.push('skillsLevel');
    } else {
      missingFields.push('skillsLevel');
    }

    // Languages fields (10 pts)
    if (languages && languages.length >= 1) {
      percentage += 3;
      completedFields.push('languagesCount');
    } else {
      missingFields.push('languagesCount');
    }

    const hasProficientSpeaking = languages?.some(
      (r) => ['PROFESSIONAL', 'FLUENT', 'NATIVE'].includes(r.speaking)
    );
    if (hasProficientSpeaking) {
      percentage += 2;
      completedFields.push('languagesProficiency');
    } else {
      missingFields.push('languagesProficiency');
    }

    return {
      percentage,
      completedFields,
      missingFields,
      version: 'candidate-profile-v5',
    };
  }
}
