import { Injectable } from '@nestjs/common';
import { CandidateProfileBasicsInput, CandidatePreferenceInput } from '@nexthire/validation';
import { CandidateProfileCompletion } from '@nexthire/types';

/**
 * candidate-profile-v4 weights (total = 100):
 *
 * Basic profile:         40 pts
 *   fullName             20
 *   professionalHeadline  8
 *   professionalSummary  10
 *   dateOfBirth           2
 *
 * Preferences:           30 pts
 *   countryCode           8
 *   currentCity           8
 *   preferredJobRoles     5
 *   preferredWorkModes    5
 *   preferredEmploymentTypes 4
 *
 * Education:             15 pts
 *   any record           10
 *   fieldOfStudy          3
 *   grade or description  2
 *
 * Work experience:       15 pts
 *   any record           10
 *   responsibilities      3
 *   achievements          2
 */
@Injectable()
export class CandidateProfileCompletionService {
  private readonly basicWeights = {
    fullName: 20,
    professionalHeadline: 8,
    professionalSummary: 10,
    dateOfBirth: 2,
  };

  private readonly preferenceWeights = {
    countryCode: 8,
    currentCity: 8,
    preferredJobRoles: 5,
    preferredWorkModes: 5,
    preferredEmploymentTypes: 4,
  };

  calculateCompletion(
    profile: Partial<CandidateProfileBasicsInput> | null,
    preferences?: Partial<CandidatePreferenceInput> | null,
    educationRecords?: any[] | null,
    workExperienceRecords?: any[] | null
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

    // Work experience fields (15 pts)
    if (workExperienceRecords && workExperienceRecords.length > 0) {
      percentage += 10;
      completedFields.push('workExperience');

      const hasResponsibilities = workExperienceRecords.some(
        (r) => r.responsibilities !== null && r.responsibilities !== undefined && String(r.responsibilities).trim() !== ''
      );
      if (hasResponsibilities) {
        percentage += 3;
        completedFields.push('workExperienceResponsibilities');
      } else {
        missingFields.push('workExperienceResponsibilities');
      }

      const hasAchievements = workExperienceRecords.some(
        (r) => r.achievements !== null && r.achievements !== undefined && String(r.achievements).trim() !== ''
      );
      if (hasAchievements) {
        percentage += 2;
        completedFields.push('workExperienceAchievements');
      } else {
        missingFields.push('workExperienceAchievements');
      }
    } else {
      missingFields.push('workExperience');
      missingFields.push('workExperienceResponsibilities');
      missingFields.push('workExperienceAchievements');
    }

    return {
      percentage,
      completedFields,
      missingFields,
      version: 'candidate-profile-v4',
    };
  }
}
