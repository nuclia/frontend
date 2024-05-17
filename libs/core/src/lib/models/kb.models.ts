export type KbConfiguration = {
  kbName: string;
  zoneSlug: string;
  semanticModel?: string;
};

export type AccountAndKbConfiguration = {
  company: string;
} & KbConfiguration;
