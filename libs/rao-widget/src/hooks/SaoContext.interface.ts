import type { NucliaFetcher, SessionsApi } from '../fetch';
import type { ICallState, INuclia, ISessions } from '../interfaces';

type SessionState = ICallState<ISessions>[string];

export interface ISaoContext {
  nuclia: INuclia | null;
  sessions: ICallState<ISessions>;
  fetchSessions: (key?: string) => Promise<void>;
  getSessions: (key?: string) => SessionState | undefined;
  fetcher?: NucliaFetcher;
  sessionsApi?: SessionsApi;
}

export interface ISaoProvider {
  nuclia: INuclia | null;
}
