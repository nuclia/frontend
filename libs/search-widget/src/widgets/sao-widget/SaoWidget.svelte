<svelte:options
  customElement={{
    tag: 'progress-sao-widget',
  }} />

<script lang="ts">
  import { Nuclia, type NucliaOptions } from '@nuclia/core';
  import { BehaviorSubject, Subscription, filter, firstValueFrom } from 'rxjs';
  import { onMount, onDestroy } from 'svelte';
  import {
    getApiErrors,
    loadFonts,
    loadSvgSprite,
    resetNuclia,
    setLang,
  } from '../../core';
  import { createElement } from 'react';
  import { createRoot, type Root } from 'react-dom/client';
  import { SaoApp } from 'rao-widget';
  import 'rao-widget/progress.css';

  const _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  export const onError = getApiErrors();
  export const reset = () => resetNuclia();

  let nucliaAPI: Nuclia | null = null;
  let svgSprite: string = $state('');
  let spriteSubscription: Subscription | null = null;
  let initializationError: string | null = $state(null);
  let hasMounted = false;
  let lastInitKey: string | null = null;

  interface SaoWidgetProps {
    backend?: string;
    aragId?: string;
    arag?: string;
    zone?: string;
    lang?: string;
    apiKey?: string;
    account?: string;
    client?: string;
    title?: string;
    userName?: string;
    cards?: string[];
    inputPlaceholder?: string;
  }

  let {
    backend = 'https://rag.progress.cloud/api',
    zone = 'europe-1',
    arag,
    aragId,
    lang = 'en',
    apiKey,
    account,
    client = 'widget',
    title = 'Progress SAO',
    userName = '',
    cards = [],
    inputPlaceholder = 'Ask your assistant...'
  }: SaoWidgetProps = $props();
  let reactHost: HTMLDivElement | null = null;
  let reactRoot: Root | null = null;

  interface SaoAppProps {
    title: string;
    userName: string;
    cards: string[];
    inputPlaceholder: string;
  }

  const renderReactApp = (reactProps: SaoAppProps) => {
    if (!reactHost || !nucliaAPI) {
      return;
    }

    if (!reactRoot) {
      reactRoot = createRoot(reactHost);
    }

    reactRoot.render(
      createElement(SaoApp, {
        nuclia: nucliaAPI,
        ...reactProps,
      }),
    );
  };

  const teardownReact = () => {
    reactRoot?.unmount();
    reactRoot = null;
  };

  const resetInitialization = (message?: string) => {
    initializationError = message ?? null;
    nucliaAPI = null;
    teardownReact();
    _ready.next(false);
  };

  const initialiseNuclia = () => {
    if (!hasMounted) {
      return;
    }

    const knowledgeBoxId = aragId ?? arag;
    const configKey = JSON.stringify({ backend, zone, knowledgeBoxId, client, account, apiKey });

    if (configKey === lastInitKey) {
      return;
    }

    lastInitKey = configKey;

    if (!account || !knowledgeBoxId || !zone) {
      resetInitialization('Account, Retrieval Agent and zone are required to render the widget.');
      return;
    }

    const nucliaOptions: NucliaOptions = {
      backend,
      zone,
      knowledgeBox: knowledgeBoxId,
      client,
      account,
      accountId: account,
      apiKey,
    };

    nucliaAPI = new Nuclia(nucliaOptions);
    initializationError = null;
    _ready.next(true);

    // Ensure React tree is mounted with the latest props once the host is ready.
    if (reactHost) {
      const reactProps: SaoAppProps = {
        title,
        userName,
        cards: Array.isArray(cards) ? cards : [],
        inputPlaceholder,
      };
      renderReactApp(reactProps);
    }
  };

  onMount(() => {
    hasMounted = true;
    loadFonts();
    spriteSubscription = loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    setLang(lang);
    initialiseNuclia();
  });

  $effect(() => {
    if (!hasMounted) {
      return;
    }
    initialiseNuclia();
  });

  $effect(() => {
    if (!hasMounted || !nucliaAPI) {
      return;
    }

    const reactProps: SaoAppProps = {
      title,
      userName,
      cards: Array.isArray(cards) ? cards : [],
      inputPlaceholder,
    };

    renderReactApp(reactProps);
  });

  $effect(() => {
    if (!hasMounted) {
      return;
    }
    setLang(lang);
  });

  onDestroy(() => {
    spriteSubscription?.unsubscribe();
    spriteSubscription = null;
    resetNuclia();
    resetInitialization();
  });
</script>

<div
  class="progress-widget"
  data-version="__NUCLIA_DEV_VERSION__">

  <div
    class="progress-widget__react-host"
    bind:this={reactHost}></div>

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>

  {#if initializationError}
    <div class="progress-widget__error" role="alert">
      {initializationError}
    </div>
  {/if}
</div>
