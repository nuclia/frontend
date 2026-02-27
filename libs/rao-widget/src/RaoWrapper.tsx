import { FC, useEffect, useState } from 'react';
import { type NucliaOptions, Nuclia } from '@nuclia/core';
import { type INuclia } from './interfaces';
import progressStyle from './progress.css?inline';
import raoStyle from './RaoApp.css?inline';
import { RaoApp } from './RaoApp';
import type { IRaoWidget } from './components/RaoWidget';

const DEFAULT_CDN =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_CDN ??
  'https://cdn.rag.progress.cloud/';
const SPRITE_URL = `${DEFAULT_CDN}icons/glyphs-sprite.svg`;

let spriteMarkupCache: string | null = null;
let spriteLoadingPromise: Promise<string> | null = null;

const loadSprite = async () => {
  if (!spriteLoadingPromise) {
    spriteLoadingPromise = fetch(SPRITE_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load icon sprite: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((svg) => {
        spriteMarkupCache = svg;
        return svg;
      })
      .catch((error) => {
        spriteLoadingPromise = null;
        throw error;
      });
  }

  return spriteLoadingPromise;
};

export interface RaoWidgetProps extends IRaoWidget {
  backend?: string;
  aragid?: string;
  arag?: string;
  zone?: string;
  lang?: string;
  apikey?: string;
  account?: string;
  client?: string;
}

export const RaoWrapper: FC<RaoWidgetProps> = ({
  aragid,
  arag,
  backend,
  zone,
  client,
  apikey,
  account,
  ...widgetProps
}) => {
  const [spriteMarkup, setSpriteMarkup] = useState<string | null>(spriteMarkupCache);

  useEffect(() => {
    if (spriteMarkupCache || typeof window === 'undefined' || typeof fetch === 'undefined') {
      return;
    }

    let isActive = true;

    loadSprite()
      .then((svg) => {
        if (isActive) {
          setSpriteMarkup(svg);
        }
      })
      .catch((error) => {
        console.error('Unable to load icon sprite', error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const knowledgeBoxId = aragid ?? arag;

  if (!account || !knowledgeBoxId || !zone) {
    console.error('Account, Retrieval Agent and zone are required to render the widget.');
    return;
  }
  const nucliaOptions: NucliaOptions = {
    backend: backend || 'https://rag.progress.cloud/api',
    zone: zone,
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

      {spriteMarkup ? (
        <div
          id="nuclia-glyphs-sprite"
          hidden
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: spriteMarkup }}
        />
      ) : null}

      <RaoApp
        nuclia={nucliaAPI}
        sessionId="ephemeral"
        {...widgetProps}
      />
    </div>
  );
};
