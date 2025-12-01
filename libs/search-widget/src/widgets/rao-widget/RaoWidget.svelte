<svelte:options
  customElement={{
    tag: 'progress-rao-widget',
  }} />

<script lang="ts">
  import { Nuclia, type NucliaOptions } from '@nuclia/core';
  import { BehaviorSubject, Subscription, filter, firstValueFrom, switchMap, take, tap } from 'rxjs';
  import { onMount, onDestroy } from 'svelte';
  import {
  addAragAnswer,
    getApiErrors,
    isEmptySearchQuery,
    loadFonts,
    loadSvgSprite,
    resetNuclia,
    searchQuery,
    setAragError,
    setAragQuestion,
    setLang,
    triggerSearch,
  } from '../../core';
  import { createElement } from 'react';
  import { createRoot, type Root } from 'react-dom/client';
  import { RaoApp } from 'rao-widget';
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

  const session: string = 'ephemeral';

  interface SaoWidgetProps {
    backend?: string;
    aragId?: string;
    arag?: string;
    session?: string;
    zone?: string;
    lang?: string;
    apiKey?: string;
    account?: string;
    client?: string;
    
    title?: string;
    userName?: string;
    cards?: string[];
    inputPlaceholder?: string;
    viewType?: 'conversation' | 'floating';
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

  interface RaoAppProps {
    title: string;
    userName: string;
    cards: string[];
    inputPlaceholder: string;
    sessionId?: string;
  }

  const renderReactApp = () => {
    if (!reactHost || !nucliaAPI) {
      return;
    }

    if (!reactRoot) {
      reactRoot = createRoot(reactHost);
    }

    const reactProps: RaoAppProps = {
      title,
      userName,
      cards: Array.isArray(cards) ? cards : [],
      inputPlaceholder,
    };

    reactRoot.render(
      createElement(RaoApp, {
        nuclia: nucliaAPI as any,
        sessionId: session,
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

    triggerSearch
      .pipe(
        filter(() => !!session),
        switchMap(() =>
          isEmptySearchQuery.pipe(
            take(1),
            filter((isEmptySearchQuery) => !isEmptySearchQuery),
            switchMap(() => searchQuery.pipe(take(1))),
            tap((question) => setAragQuestion(question)),
            switchMap((question) => {
              if (nucliaAPI && nucliaAPI.arag && session) {
                return nucliaAPI.arag.interact(session, question);
              }
              // Return an empty observable if not available
              return [];
            }),
          ),
        ),
      )
      .subscribe({
        next: (data) => {
          if (data.type === 'answer') {
            addAragAnswer(data.answer);
          } else {
            setAragError(data);
          }
        },
        error: (error) =>
          setAragError({
            type: 'error',
            body: error,
            status: -1,
            detail: 'Unexpected error while interacting with the Retrieval Agent.',
          }),
      });

    _ready.next(true);

    // Ensure React tree is mounted with the latest props once the host is ready.
    if (reactHost) {
      renderReactApp();
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

    renderReactApp();
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
