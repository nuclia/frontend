export interface BedrockParameters {
  external_id: string;
  role_name: string;
  aws_account_id: string;
}

export interface BedrockPayload {
  role_arn: string;
}

export interface BedrockStatus {
  status: 'none' | 'active' | 'incomplete' | 'error';
  errorMessage?: string;
}

export const DEFAULT_IAM_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'AllowBedrockInvocation',
      Effect: 'Allow',
      Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      Resource: ['arn:aws:bedrock:*::foundation-model/*', 'arn:aws:bedrock:*:*:inference-profile/*'],
    },
  ],
};
