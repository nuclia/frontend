export interface OnboardingPayload {
  company: string;
  phone: string;
  receive_updates: boolean;
  use_case?: string;
  learn_about_us?: string;
  organization_size?: string;
}

export interface OnboardingStatus {
  creating: boolean;
  accountCreated: boolean;
  kbCreated: boolean;
  creationFailed: boolean;
}

export type OnboardingStep = 'step1' | 'step2' | 'setting-up';
export const GETTING_STARTED_DONE_KEY = 'NUCLIA_GETTING_STARTED_DONE';
