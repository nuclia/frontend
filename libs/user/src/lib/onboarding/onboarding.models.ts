export interface OnboardingPayload {
  company: string;
  phone: string;
  receive_updates: boolean;
  use_case?: string;
  hosted_nucliadb?: boolean;
  organization_size?: string;
}
export type DatasetType = { id: string; title: string; description: string };

export type KbConfiguration = {
  zoneSlug: string;
  multilingual: boolean;
  languages: string[];
  ownData: boolean;
  dataset?: string;
};

export type AccountAndKbConfiguration = {
  company: string;
} & KbConfiguration;

export interface OnboardingStatus {
  creating: boolean;
  accountCreated: boolean;
  kbCreated: boolean;
  creationFailed: boolean;
  datasetImported: boolean;
}

export type OnboardingStep = 'step1' | 'step2' | 'setting-up-dataset' | 'setting-up-upload';
