import { FC } from 'react';
import { SaoProvider } from './hooks';
import { SaoWidget, ISaoWidget } from './components/SaoWidget';
import type { INuclia } from './interfaces';

import './progress.css';
import './SaoApp.css';

export interface SaoAppProps extends ISaoWidget {
  nuclia: INuclia | null;
  sessionId?: string;
}

export const SaoApp: FC<SaoAppProps> = ({ nuclia, sessionId, ...widgetProps }) => {
  return (
    <SaoProvider
      nuclia={nuclia}
      sessionId={sessionId}>
      <SaoWidget {...widgetProps} />
    </SaoProvider>
  );
};
