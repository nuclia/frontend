export interface ConfigurationForm {
  name: string;
  syncSecurityGroups: boolean | null;
  preserveLabels: boolean | null;
  assumeRole: {
    external_id: string;
    role_arn: string;
  };
  extra: {
    [fieldId: string]: string;
  };
}
