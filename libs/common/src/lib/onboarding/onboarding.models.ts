export interface OnboardingPayload {
  company: string;
  phone: string;
  receive_updates: boolean;
  use_case?: string;
  role?: string;
  organization_size?: string;
  country: string;
  accept_privacy_policy: boolean;
}

export interface AwsOnboardingPayload extends OnboardingPayload {
  first_name: string;
  last_name: string;
  owner_email_address: string;
}

export interface OnboardingStatus {
  creating: boolean;
  accountCreated: boolean;
  kbCreated: boolean;
  creationFailed: boolean;
}

export type OnboardingStep = 'step1' | 'step2' | 'setting-up';
