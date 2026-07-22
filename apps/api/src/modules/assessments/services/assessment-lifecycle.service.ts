import { Injectable } from '@nestjs/common';
import { isValidTransition } from '@nexthire/validation';

@Injectable()
export class AssessmentLifecycleService {
  isValidTransition(from: string, to: string): boolean {
    return isValidTransition(from, to);
  }

  getValidTransitions(): { from: string; to: string }[] {
    return [
      { from: 'DRAFT', to: 'PUBLISHED' },
      { from: 'PUBLISHED', to: 'ARCHIVED' },
      { from: 'ARCHIVED', to: 'PUBLISHED' },
      { from: 'PUBLISHED', to: 'RETIRED' },
      { from: 'ARCHIVED', to: 'RETIRED' },
    ];
  }
}
