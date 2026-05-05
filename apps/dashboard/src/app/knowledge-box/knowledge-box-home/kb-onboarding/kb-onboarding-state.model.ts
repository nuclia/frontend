export type OnboardingStep = 'uploading-data' | 'processing-data' | 'searching-data';

export interface KbOnboardingEntry {
  skipped: boolean;
  currentStep: OnboardingStep;
}

// Keyed by KB ID
export type KbOnboardingStateMap = Record<string, KbOnboardingEntry>;
