export type KbLanguageConf = {
  multilingual: boolean;
  languages: string[];
};

export type KbConfiguration = {
  zoneSlug: string;
  ownData: boolean;
  dataset?: string;
} & KbLanguageConf;

export type AccountAndKbConfiguration = {
  company: string;
} & KbConfiguration;
