import { Injectable } from '@nestjs/common';
import { CandidateProfileBasicsInput, CandidatePreferenceInput } from '@nexthire/validation';
import { CandidateProfileCompletion } from '@nexthire/types';

@Injectable()
export class CandidateProfileCompletionService {
  private readonly basicWeights = {
    fullName: 30,
    professionalHeadline: 10,
    professionalSummary: 15,
    dateOfBirth: 5,
  };

  private readonly preferenceWeights = {
    countryCode: 10,
    currentCity: 10,
    preferredJobRoles: 10,
    preferredWorkModes: 5,
    preferredEmploymentTypes: 5,
  };

  calculateCompletion(
    profile: Partial<CandidateProfileBasicsInput> | null,
    preferences?: Partial<CandidatePreferenceInput> | null
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

    return {
      percentage,
      completedFields,
      missingFields,
      version: 'candidate-profile-v2',
    };
  }
}
