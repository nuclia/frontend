export type KbLanguageConf = {
  multilingual: boolean;
  languages: string[];
  semanticModel?: string;
};

export type KbConfiguration = {
  zoneSlug: string;
} & KbLanguageConf;

export type AccountAndKbConfiguration = {
  company: string;
} & KbConfiguration;
