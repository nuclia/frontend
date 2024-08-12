import { ExternalIndexProvider } from '@nuclia/core';

export type KbConfiguration = {
  kbName: string;
  zoneSlug: string;
  semanticModel?: string;
};

export type AccountAndKbConfiguration = {
  company: string;
  externalIndexProvider?: ExternalIndexProvider | null;
} & KbConfiguration;
