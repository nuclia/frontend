import type { NucliaFetcher } from './client';
import type { ISession, ISessions, ISessionCreatePayload } from '../interfaces';

export interface ListSessionsParams {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

export const createSessionsApi = (fetcher: NucliaFetcher, retrievalAgentId: string) => {
  const basePath = `/v1/retrieval-agents/${encodeURIComponent(retrievalAgentId)}/sessions`;

  const list = async (params?: ListSessionsParams): Promise<ISessions> => {
    const { page, size, signal } = params ?? {};
    return fetcher.get<ISessions>(basePath, {
      searchParams: {
        page,
        size,
      },
      signal,
    });
  };

  const get = async (sessionId: string, signal?: AbortSignal): Promise<ISession> => {
    return fetcher.get<ISession>(`${basePath}/${encodeURIComponent(sessionId)}`, { signal });
  };

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
