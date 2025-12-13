import type { NucliaFetcher, SessionsApi } from '../repository';
import type { ICallState, IMessage, INuclia, ISessions } from '../interfaces';
import { EViewType, IRaoWidget, IResources } from '../components/RaoWidget';

type SessionState = ICallState<ISessions>[string];

export interface IRaoProvider extends IRaoWidget {
  nuclia: INuclia | null;
  sessionId?: string | null;
}

export interface IRaoContext extends Omit<IRaoProvider, 'sessionId' | 'resources'> {
  sessionId: string | null;
  sessions: ICallState<ISessions>;
  getSessionsAPI: (key?: string) => Promise<void>;
  getSessions: (key?: string) => SessionState | undefined;
  fetcher?: NucliaFetcher;
  sessionsApi?: SessionsApi;
  authToken: string | null;

  activeView: 'main' | 'conversation';
  visibleViewType: EViewType;
  setVisibleViewType: React.Dispatch<React.SetStateAction<EViewType>>;
  conversation: IMessage[] | null;
  onChat: (message: string) => void;

  resources: IResources;
}
