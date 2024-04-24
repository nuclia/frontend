export type KbConfiguration = {
  zoneSlug: string;
  semanticModel?: string;
};

export type AccountAndKbConfiguration = {
  company: string;
} & KbConfiguration;
