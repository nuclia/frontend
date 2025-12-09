import type { NucliaFetcher, SessionsApi } from '../repository';
import type { ICallState, IMessage, INuclia, ISessions } from '../interfaces';

type SessionState = ICallState<ISessions>[string];

export interface IRaoProvider {
  nuclia: INuclia | null;
  sessionId?: string | null;
}

export interface IRaoContext extends Omit<IRaoProvider, 'sessionId'> {
  sessionId: string | null;
  sessions: ICallState<ISessions>;
  getSessionsAPI: (key?: string) => Promise<void>;
  getSessions: (key?: string) => SessionState | undefined;
  fetcher?: NucliaFetcher;
  sessionsApi?: SessionsApi;
  authToken: string | null;

  activeView: 'main' | 'conversation';
  conversation: IMessage[] | null;
  onChat: (message: string) => void;
}
