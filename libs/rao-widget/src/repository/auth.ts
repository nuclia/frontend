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
    const jwtKey = localStorage.getItem('JWT_KEY');
    const useServiceAccountHeader =
      options?.useServiceAccountHeader ?? config?.defaultUseServiceAccountHeader ?? jwtKey ?? false;

    const apiKey = jwtKey ?? config?.serviceAccountKey;
    let authorizationHeader: string | undefined = apiKey ? `Bearer ${apiKey}` : undefined;

    const headers =
      useServiceAccountHeader && authorizationHeader
        ? {
            'x-nuclia-serviceaccount': authorizationHeader,
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
