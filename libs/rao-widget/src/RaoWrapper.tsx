import { FC } from 'react';
import { type NucliaOptions, Nuclia } from '@nuclia/core';
import { type INuclia } from './interfaces';
import progressStyle from './progress.css?inline';
import raoStyle from './RaoApp.css?inline';
import { RaoApp } from './RaoApp';

export interface RaoWidgetProps {
  backend?: string;
  aragid?: string;
  arag?: string;
  zone?: string;
  lang?: string;
  apikey?: string;
  account?: string;
  client?: string;

  title?: string;
  username?: string;
  cards?: string[];
  inputplaceholder?: string;
  viewtype?: 'conversation' | 'floating';
}

export const RaoWrapper: FC<RaoWidgetProps> = ({
  aragid,
  arag,
  backend,
  zone,
  client,
  account,
  apikey,
  ...widgetProps
}) => {
  const knowledgeBoxId = aragid ?? arag;
  const configKey = JSON.stringify({ backend, zone, knowledgeBoxId, client, account, apiKey: apikey });
  if (!account || !knowledgeBoxId || !zone) {
    console.error('Account, Retrieval Agent and zone are required to render the widget.');
    return;
  }
  const nucliaOptions: NucliaOptions = {
    backend: backend || 'https://rag.progress.cloud/api',
    zone: zone || 'europe-1',
    knowledgeBox: knowledgeBoxId,
    client,
    account,
    accountId: account,
    apiKey: apikey,
  };
  const nucliaAPI = new Nuclia(nucliaOptions) as INuclia;
  return (
    <div
      className="progress-widget"
      data-version="__NUCLIA_DEV_VERSION__">
      <style>{progressStyle}</style>
      <style>{raoStyle}</style>
      <RaoApp
        nuclia={nucliaAPI}
        sessionId="ephemeral"
        {...widgetProps}></RaoApp>
    </div>
  );
};
