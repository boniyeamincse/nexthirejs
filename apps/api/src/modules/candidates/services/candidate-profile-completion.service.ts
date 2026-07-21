import { Injectable } from '@nestjs/common';
import { CandidateProfileBasicsInput, CandidatePreferenceInput } from '@nexthire/validation';
import { CandidateProfileCompletion } from '@nexthire/types';

@Injectable()
export class CandidateProfileCompletionService {
  private readonly basicWeights = {
    fullName: 20,
    professionalHeadline: 10,
    professionalSummary: 15,
    dateOfBirth: 5,
  };

  private readonly preferenceWeights = {
    countryCode: 10,
    currentCity: 10,
    preferredJobRoles: 5,
    preferredWorkModes: 5,
    preferredEmploymentTypes: 5,
  };

  calculateCompletion(
    profile: Partial<CandidateProfileBasicsInput> | null,
    preferences?: Partial<CandidatePreferenceInput> | null,
    educationRecords?: any[] | null
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

    // Education fields
    if (educationRecords && educationRecords.length > 0) {
      percentage += 10;
      completedFields.push('education');
      
      const hasFieldOfStudy = educationRecords.some(r => r.fieldOfStudy !== null && r.fieldOfStudy !== undefined && String(r.fieldOfStudy).trim() !== '');
      if (hasFieldOfStudy) {
        percentage += 3;
        completedFields.push('educationFieldOfStudy');
      } else {
        missingFields.push('educationFieldOfStudy');
      }

      const hasGradeOrDescription = educationRecords.some(r => 
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

    return {
      percentage,
      completedFields,
      missingFields,
      version: 'candidate-profile-v3',
    };
  }
}
