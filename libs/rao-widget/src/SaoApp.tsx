import { FC } from 'react';
import { SaoProvider } from './hooks';
import { SaoWidget } from './components/SaoWidget/SaoWidget';
import type { INuclia } from './interfaces';

import './progress.css';
import './SaoApp.css';

export interface SaoAppProps {
  nuclia: INuclia | null;
  title: string;
  userName: string;
  cards: string[];
  inputPlaceholder: string;
}

export const SaoApp: FC<SaoAppProps> = ({ nuclia, ...widgetProps }) => {
  return (
    <SaoProvider nuclia={nuclia}>
      <SaoWidget {...widgetProps} />
    </SaoProvider>
  );
};
