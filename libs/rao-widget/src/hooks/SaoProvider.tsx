import React, { FC, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { SaoContext } from './SaoContext';
import { type ISaoProvider } from './SaoContext.interface';
import type { ICallState, INuclia, ISessions } from '../interfaces';
import { createNucliaFetcher, createSessionsApi, type NucliaFetcher, type SessionsApi } from '../fetch';

export const SaoProvider: FC<PropsWithChildren<ISaoProvider>> = ({ children, nuclia }) => {
  // TODO: Load users Sessions

  const [sessionsState, _setSessionsState] = useState<ICallState<ISessions>>({});
  const fetcher: NucliaFetcher | undefined = useMemo(() => {
    if (!nuclia?.options?.backend) {
      return undefined;
    }

    return createNucliaFetcher({
      baseUrl: nuclia.options.backend,
      apiKey: nuclia.options.apiKey,
      headers: {
        'X-Nuclia-Account': nuclia.options.accountId ?? nuclia.options.account,
        'X-Nuclia-Zone': nuclia.options.zone,
        'X-Nuclia-KnowledgeBox': nuclia.options.knowledgeBox,
      },
    });
  }, [nuclia]);

  const sessionsApi: SessionsApi | undefined = useMemo(() => {
    const knowledgeBox = nuclia?.options?.knowledgeBox;
    if (!fetcher || !knowledgeBox) {
      return undefined;
    }
    return createSessionsApi(fetcher, knowledgeBox);
  }, [fetcher, nuclia?.options?.knowledgeBox]);

  const fetchSessions = useCallback(
    async (key: string = 'default') => {
      if (!sessionsApi) {
        return;
      }

      const sessions = await sessionsApi.list();
      _setSessionsState((prev) => ({
        ...prev,
        [key]: {
          data: sessions,
          status: 'success',
        },
      }));
    },
    [sessionsApi],
  );

  // TODO: Trigger POST request

  const getSessions = useCallback(
    (key: string = 'default') => {
      return sessionsState[key];
    },
    [sessionsState],
  );

  const value = useMemo(
    () => ({
      nuclia: nuclia ?? null,
      sessions: sessionsState,
      fetchSessions,
      getSessions,
      fetcher,
    }),
    [nuclia, sessionsState, fetchSessions, getSessions, fetcher],
  );

  return <SaoContext.Provider value={value}>{children}</SaoContext.Provider>;
};
