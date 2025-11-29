import type { NucliaFetcher } from './client';

export interface EphemeralTokenResponse {
  token: string;
}

export interface AuthApiConfig {
  serviceAccountKey?: string;
  defaultUseServiceAccountHeader?: boolean;
}

export interface CreateEphemeralTokenOptions {
  useServiceAccountHeader?: boolean;
  payload?: Record<string, unknown>;
}

export const createAuthApi = (
  fetcher: NucliaFetcher,
  accountId: string,
  knowledgeBoxId: string,
  config?: AuthApiConfig,
) => {
  const path = `/api/v1/account/${encodeURIComponent(accountId)}/kb/${encodeURIComponent(
    knowledgeBoxId,
  )}/ephemeral_tokens`;

  const createEphemeralToken = async (options?: CreateEphemeralTokenOptions): Promise<EphemeralTokenResponse> => {
    const useServiceAccountHeader = options?.useServiceAccountHeader ?? config?.defaultUseServiceAccountHeader ?? false;
    const headers =
      useServiceAccountHeader && config?.serviceAccountKey
        ? {
            'x-nuclia-serviceaccount': `Bearer ${config.serviceAccountKey}`,
          }
        : undefined;

    const body = options?.payload;

    return fetcher.post<EphemeralTokenResponse>(path, {
      headers,
      body,
    });
  };

  return {
    createEphemeralToken,
  };
};

export type AuthApi = ReturnType<typeof createAuthApi>;
