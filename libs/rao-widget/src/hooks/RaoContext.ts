import React from 'react';
import { type IRaoContext } from './RaoContext.interface';

const defaultContext: IRaoContext = {
  nuclia: null,
  sessionId: null,
  sessions: {},
  getSessionsAPI: async () => {},
  getSessions: () => undefined,
  fetcher: undefined,
  sessionsApi: undefined,
  authToken: null,
  activeView: 'conversation',
  visibleViewType: 'conversation',
  setVisibleViewType: () => {},
  conversation: null,
  onChat: () => {},
  // @ts-expect-error - placeholder default
  resources: {},
};

export const RaoContext = React.createContext<IRaoContext>(defaultContext);

export const useRaoContext = () => {
  const context = React.useContext(RaoContext);
  if (!context) {
    throw new Error('useRaoContext must be used within a RaoProvider');
  }
  return context;
};
