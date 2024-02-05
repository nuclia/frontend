export type KbLanguageConf = {
  multilingual: boolean;
  languages: string[];
};

export type KbConfiguration = {
  zoneSlug: string;
} & KbLanguageConf;

export type AccountAndKbConfiguration = {
  company: string;
} & KbConfiguration;
