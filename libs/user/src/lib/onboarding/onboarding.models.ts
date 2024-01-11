export interface OnboardingPayload {
  company: string;
  phone: string;
  receive_updates: boolean;
  use_case?: string;
  learn_about_us?: string;
  organization_size?: string;
}
export type DatasetType = { id: string; title: string; description: string };

export interface OnboardingStatus {
  creating: boolean;
  accountCreated: boolean;
  kbCreated: boolean;
  creationFailed: boolean;
  datasetImported: boolean;
}

export type OnboardingStep = 'step1' | 'step2' | 'setting-up-dataset' | 'setting-up-upload';
export const GETTING_STARTED_DONE_KEY = 'NUCLIA_GETTING_STARTED_DONE';
