import type { NucliaFetcher } from './client';
import type { ISession, ISessions, ISessionCreatePayload } from '../interfaces';

export interface ListSessionsParams {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

export const createSessionsApi = (fetcher: NucliaFetcher, retrievalAgentId: string) => {
  const basePath = `/api/v1/kb/${encodeURIComponent(retrievalAgentId)}/catalog`;

  const list = async (params?: ListSessionsParams): Promise<ISessions> => {
    const { page, size, signal } = params ?? {};
    return fetcher.post<ISessions, ListSessionsParams | undefined>(basePath, {
      body:
        page !== undefined || size !== undefined
          ? {
              page,
              size,
            }
          : undefined,
      signal,
    });
  };

  const get = async (sessionId: string, signal?: AbortSignal): Promise<ISession> => {
    return fetcher.get<ISession>(`${basePath}/${encodeURIComponent(sessionId)}`, { signal });
  };

  // TODO: Will not work until the user is authenticated
  const create = async (payload: ISessionCreatePayload, signal?: AbortSignal): Promise<ISession> => {
    return fetcher.post<ISession, ISessionCreatePayload>(basePath, {
      body: payload,
      signal,
    });
  };

  return {
    list,
    get,
    create,
  };
};

export type SessionsApi = ReturnType<typeof createSessionsApi>;
