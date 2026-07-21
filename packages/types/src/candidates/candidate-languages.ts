export enum LanguageProficiency {
  BASIC = 'BASIC',
  CONVERSATIONAL = 'CONVERSATIONAL',
  PROFESSIONAL = 'PROFESSIONAL',
  FLUENT = 'FLUENT',
  NATIVE = 'NATIVE',
}

export interface CandidateLanguageResult {
  id: string;
  name: string;
  speaking: LanguageProficiency;
  reading: LanguageProficiency;
  writing: LanguageProficiency;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
