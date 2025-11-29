import React from 'react';
import { ISaoContext } from './SaoContext.interface';

const defaultContext: ISaoContext = {
  nuclia: null,
  sessionId: null,
  sessions: {},
  getSessionsAPI: async () => {},
  getSessions: () => undefined,
  fetcher: undefined,
  sessionsApi: undefined,
  authToken: null,
  activeView: 'conversation',
  conversation: null,
  onChat: () => {},
};

export const SaoContext = React.createContext<ISaoContext>(defaultContext);

export const useSaoContext = () => {
  const context = React.useContext(SaoContext);
  if (!context) {
    throw new Error('useSaoContext must be used within a SaoProvider');
  }
  return context;
};
