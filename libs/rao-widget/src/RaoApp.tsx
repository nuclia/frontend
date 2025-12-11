import { FC } from 'react';
import { RaoProvider } from './hooks';
import { RaoWidget, IRaoWidget } from './components/RaoWidget';
import type { INuclia } from './interfaces';

export interface RaoAppProps extends IRaoWidget {
  nuclia: INuclia | null;
  sessionId?: string;
}

export const RaoApp: FC<RaoAppProps> = ({ nuclia, sessionId, ...widgetProps }) => {
  return (
    <RaoProvider
      nuclia={nuclia}
      sessionId={sessionId}
      {...widgetProps}>
      <RaoWidget {...widgetProps} />
    </RaoProvider>
  );
};
