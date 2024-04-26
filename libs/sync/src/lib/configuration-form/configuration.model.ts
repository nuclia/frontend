import { Classification } from '@nuclia/core';

export interface FiltersResources {
  extensions: string | null;
  extensionUsage: 'include' | 'exclude';
  from: string | null;
  to: string | null;
}

export interface ConfigurationForm {
  name: string;
  syncSecurityGroups: boolean | null;
  filterResources: FiltersResources;
  extra: {
    [sectionId: string]: {
      [fieldId: string]: string;
    };
  };
}

export interface FullConfiguration {
  form: ConfigurationForm;
  tables: { [tableId: string]: { key: string; value: string; secret: boolean }[] };
  labels: Classification[];
}
